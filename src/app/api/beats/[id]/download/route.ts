import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type StorageObjectLocation = {
  bucket: string;
  path: string;
};

function safeFileName(input?: string | null) {
  return (input || "br-beat")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "br-beat";
}

function getStorageObjectLocation(value: string): StorageObjectLocation | null {
  try {
    const url = new URL(value);
    const markers = [
      "/storage/v1/object/public/",
      "/storage/v1/object/sign/",
      "/storage/v1/object/authenticated/",
      "/storage/v1/object/",
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));

    if (!marker) {
      return null;
    }

    const objectPath = decodeURIComponent(url.pathname.split(marker)[1] || "");
    const [bucket, ...pathParts] = objectPath.split("/");
    const path = pathParts.join("/");

    if (!bucket || !path) {
      return null;
    }

    return { bucket, path };
  } catch {
    return null;
  }
}

async function loadFullAudio(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  fullAudioUrl: string,
) {
  let directStatus: number | null = null;

  try {
    const response = await fetch(fullAudioUrl, { cache: "no-store" });
    directStatus = response.status;

    if (response.ok && response.body) {
      return {
        body: response.body,
        contentType: response.headers.get("content-type") || "audio/mpeg",
      };
    }
  } catch (error) {
    console.error("B.R direct full audio fetch error", error);
  }

  const storageObject = getStorageObjectLocation(fullAudioUrl);

  if (!storageObject) {
    console.error("B.R full audio URL is not a recognized Supabase Storage URL", {
      fullAudioUrl,
      directStatus,
    });
    return null;
  }

  const candidatePaths = Array.from(
    new Set([
      storageObject.path,
      storageObject.path.replace(/^public\//, ""),
      storageObject.path.replace(/^private\//, ""),
    ]),
  ).filter(Boolean);

  for (const path of candidatePaths) {
    const { data, error } = await supabase.storage
      .from(storageObject.bucket)
      .download(path);

    if (!error && data) {
      return {
        body: data.stream(),
        contentType: data.type || "audio/mpeg",
      };
    }

    console.error("B.R storage full audio download error", {
      bucket: storageObject.bucket,
      path,
      directStatus,
      error,
    });
  }

  return null;
}

async function logDownloadActivity(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  input: { userId: string; userEmail?: string | null; beat: { id: string; title?: string | null; slug?: string | null } },
) {
  const { error } = await supabase.from("commercial_activity").insert({
    event_type: "mp3_download",
    user_id: input.userId,
    user_email: input.userEmail ?? null,
    beat_id: input.beat.id,
    beat_title: input.beat.title ?? null,
    beat_slug: input.beat.slug ?? null,
    metadata: { source: "download_api" },
  });

  if (error) {
    console.error("B.R commercial activity mp3_download log error", error);
  }
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return Response.json({ ok: false, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en servidor." }, { status: 500 });
  }

  const token = getBearerToken(request);

  if (!token) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { id } = await context.params;
  const beatIdentifier = decodeURIComponent(id).trim();

  if (!beatIdentifier) {
    return Response.json({ ok: false, message: "Beat no válido." }, { status: 400 });
  }

  const beatSelect = "id,title,slug,full_audio_url";

  let { data: beat, error: beatError } = await supabase
    .from("beats")
    .select(beatSelect)
    .eq("id", beatIdentifier)
    .maybeSingle();

  if (!beat && !beatError) {
    const slugResult = await supabase
      .from("beats")
      .select(beatSelect)
      .eq("slug", beatIdentifier)
      .maybeSingle();

    beat = slugResult.data;
    beatError = slugResult.error;
  }

  if (beatError) {
    console.error("B.R download beat lookup error", beatError);
    return Response.json({ ok: false, message: "No se pudo validar el beat." }, { status: 500 });
  }

  if (!beat) {
    return Response.json({ ok: false, message: "Beat no disponible." }, { status: 404 });
  }

  if (!beat.full_audio_url) {
    return Response.json({ ok: false, message: "Este beat no tiene audio completo disponible." }, { status: 404 });
  }

  const { data: accessRow, error: accessError } = await supabase
    .from("beat_access")
    .select("beat_id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .maybeSingle();

  if (accessError) {
    console.error("B.R download access lookup error", accessError);
    return Response.json({ ok: false, message: "No se pudo validar el acceso." }, { status: 500 });
  }

  if (!accessRow) {
    return Response.json({ ok: false, message: "No tienes acceso para descargar este beat." }, { status: 403 });
  }


  const { data: paymentRow, error: paymentError } = await supabase
    .from("manual_payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    console.error("B.R download payment lookup error", paymentError);
    return Response.json({ ok: false, message: "No se pudo validar el pago." }, { status: 500 });
  }

  if (!paymentRow) {
    return Response.json({ ok: false, message: "El pago todavía no ha sido liberado para este beat." }, { status: 403 });
  }

  const audioFile = await loadFullAudio(supabase, beat.full_audio_url);

  if (!audioFile) {
    console.error("B.R full audio unavailable", {
      beatId: beat.id,
      beatSlug: beat.slug,
      fullAudioUrl: beat.full_audio_url,
    });

    return Response.json(
      {
        ok: false,
        message: "El archivo de audio completo no existe en la ruta guardada. Vuelve a subir el Full Audio de este beat desde Administración.",
      },
      { status: 502 },
    );
  }

  await logDownloadActivity(supabase, {
    userId: user.id,
    userEmail: user.email,
    beat,
  });

  const filename = `${safeFileName(beat.slug || beat.title)}.mp3`;

  return new Response(audioFile.body, {
    headers: {
      "Content-Type": audioFile.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
