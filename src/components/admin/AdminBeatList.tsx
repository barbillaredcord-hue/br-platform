"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAdminChangeLog, deleteBeatAsAdmin, getAdminChangeLogs, getProfilesResult, updateBeatMetadataAsAdmin, updateBeatPlaybackVisibilityAsAdmin, type AdminChangeLog } from "@/lib/supabase/queries";
import { PlayButton } from "../PlayButton";
import { AdminBeatStatus } from "./AdminBeatStatus";

type AdminBeat = Beat & { isActive?: boolean | null };
type MetadataField = "genre" | "bpm" | "musicalKey";
const beatHistoryEventTypes = new Set(["active_toggle", "metadata_update", "playback_visibility_update", "beat_hidden", "preview_update"]);
const beatHistoryStorageKey = "br-admin-beat-change-history";
const beatHistoryRetentionMs = 7 * 24 * 60 * 60 * 1000;

function isBeatChangeEvent(event: AdminChangeLog) {
  return beatHistoryEventTypes.has(event.event_type) && (event.target_type === "beat" || !event.target_type);
}

function sortChangeEvents(events: AdminChangeLog[]) {
  return [...events].sort((firstEvent, secondEvent) => new Date(secondEvent.created_at).getTime() - new Date(firstEvent.created_at).getTime());
}

function isRecentBeatChangeEvent(event: AdminChangeLog) {
  const createdAt = new Date(event.created_at).getTime();

  if (!Number.isFinite(createdAt)) {
    return false;
  }

  return Date.now() - createdAt <= beatHistoryRetentionMs;
}

function getStoredBeatChangeEvents() {
  if (typeof window === "undefined") {
    return [] as AdminChangeLog[];
  }

  try {
    const rawEvents = window.localStorage.getItem(beatHistoryStorageKey);
    const parsedEvents = rawEvents ? JSON.parse(rawEvents) : [];

    if (!Array.isArray(parsedEvents)) {
      return [] as AdminChangeLog[];
    }

    return sortChangeEvents(parsedEvents.filter(isBeatChangeEvent).filter(isRecentBeatChangeEvent) as AdminChangeLog[]);
  } catch {
    return [] as AdminChangeLog[];
  }
}

function saveStoredBeatChangeEvents(events: AdminChangeLog[]) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueEvents = new Map<string, AdminChangeLog>();

  for (const event of events.filter(isBeatChangeEvent).filter(isRecentBeatChangeEvent)) {
    uniqueEvents.set(event.id, event);
  }

  window.localStorage.setItem(beatHistoryStorageKey, JSON.stringify(sortChangeEvents([...uniqueEvents.values()])));
}

function mergeBeatChangeEvents(events: AdminChangeLog[]) {
  const uniqueEvents = new Map<string, AdminChangeLog>();

  for (const event of events.filter(isBeatChangeEvent).filter(isRecentBeatChangeEvent)) {
    uniqueEvents.set(event.id, event);
  }

  return sortChangeEvents([...uniqueEvents.values()]);
}

function getUsersWithBeatAccess(beat: Beat, users: User[] = []) {
  return users.filter((user) => user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId)));
}

function PlaybackVisibilityBadge({ beat }: { beat: Beat }) {
  const isPublicPlayback = beat.playbackVisibility === "public";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${isPublicPlayback ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>
      {isPublicPlayback ? "Público" : "Privado"}
    </span>
  );
}

function editableValue(beat: AdminBeat, field: MetadataField) {
  if (field === "genre") {
    return beat.genre;
  }

  if (field === "bpm") {
    return String(beat.bpm || "");
  }

  return beat.key ?? "";
}

function metadataFieldLabel(field: MetadataField) {
  if (field === "genre") {
    return "género";
  }

  if (field === "bpm") {
    return "BPM";
  }

  return "tonalidad";
}

function formatChangeValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  return String(value);
}

function formatChangeDetail(event: AdminChangeLog) {
  const metadata = event.metadata as Record<string, unknown> | null | undefined;

  if (metadata?.field && "previousValue" in metadata && "nextValue" in metadata) {
    return `${metadataFieldLabel(String(metadata.field) as MetadataField)}: ${formatChangeValue(metadata.previousValue)} → ${formatChangeValue(metadata.nextValue)}`;
  }

  if ("previousPlaybackVisibility" in (metadata ?? {}) && "nextPlaybackVisibility" in (metadata ?? {})) {
    return `Reproducción: ${formatChangeValue(metadata?.previousPlaybackVisibility)} → ${formatChangeValue(metadata?.nextPlaybackVisibility)}`;
  }

  if ("previousIsActive" in (metadata ?? {}) && "nextIsActive" in (metadata ?? {})) {
    return `Estado: ${metadata?.previousIsActive ? "Activo" : "Inactivo"} → ${metadata?.nextIsActive ? "Activo" : "Inactivo"}`;
  }

  if (event.event_type === "preview_update") {
    const startSecond = formatChangeValue(metadata?.startSecond);
    const previousDuration = formatChangeValue(metadata?.previousDurationSeconds);
    const nextDuration = formatChangeValue(metadata?.nextDurationSeconds);
    return `Preview: inicio ${startSecond}s · duración ${previousDuration}s → ${nextDuration}s`;
  }

  return event.description;
}

export function AdminBeatList({ beats, users = [] }: { beats: Beat[]; users?: User[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [adminBeats, setAdminBeats] = useState<Beat[]>(beats);
  const [localUsers, setLocalUsers] = useState(users);
  const [deletingBeatId, setDeletingBeatId] = useState("");
  const [updatingVisibilityBeatId, setUpdatingVisibilityBeatId] = useState("");
  const [editingCell, setEditingCell] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [savingBeatId, setSavingBeatId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [catalogLoadMessage, setCatalogLoadMessage] = useState("");
  const [changeEvents, setChangeEvents] = useState<AdminChangeLog[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const loadChangeEvents = useCallback(async () => {
    const result = await getAdminChangeLogs({ temporary: true });

    const storedEvents = getStoredBeatChangeEvents();

    if (result.ok) {
      const mergedEvents = mergeBeatChangeEvents([...result.logs, ...storedEvents]);
      setChangeEvents(mergedEvents);
      saveStoredBeatChangeEvents(mergedEvents);
      return;
    }

    setChangeEvents(storedEvents);
    setActionMessage("No se pudo cargar historial de cambios. Se muestra respaldo local de 7 días.");
  }, []);

  const addChangeEvent = useCallback(async (input: { action: string; eventType: string; beat: string; description: string; commandText: string; metadata?: Record<string, unknown> }) => {
    const result = await createAdminChangeLog({
      blockTitle: input.action,
      eventType: input.eventType,
      targetType: "beat",
      targetName: input.beat,
      description: input.description,
      commandText: input.commandText,
      metadata: input.metadata,
      temporary: true,
    });

    if (result.ok && result.log) {
      setChangeEvents((current) => {
        const mergedEvents = mergeBeatChangeEvents([result.log as AdminChangeLog, ...current, ...getStoredBeatChangeEvents()]);
        saveStoredBeatChangeEvents(mergedEvents);
        return mergedEvents;
      });
      return;
    }

    setActionMessage("No se pudo guardar historial de cambios.");
  }, []);

  const loadAdminBeats = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setCatalogLoadMessage("No se pudo cargar catálogo admin: Supabase no está configurado.");
      return false;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setCatalogLoadMessage("No se pudo cargar catálogo admin: sesión no válida.");
      return false;
    }

    const response = await fetch("/api/admin/beats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({ ok: false, message: "No se pudo cargar catálogo admin." }));

    if (!response.ok || !payload.ok || !Array.isArray(payload.beats)) {
      setCatalogLoadMessage(payload.message ?? "No se pudo cargar catálogo admin.");
      return false;
    }

    setAdminBeats(payload.beats);
    setCatalogLoadMessage("");
    return true;
  }, []);

  const filteredBeats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return adminBeats;
    }

    return adminBeats.filter((beat) => [beat.name, beat.id, beat.genre, String(beat.bpm)].some((value) => value.toLowerCase().includes(term)));
  }, [adminBeats, search]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void getProfilesResult(createSupabaseBrowserClient()).then((result) => {
        if (result.users.length) {
          setLocalUsers(result.users);
        }
      });
      void loadAdminBeats();
      void loadChangeEvents();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadAdminBeats, loadChangeEvents, pathname]);

  async function deleteBeat(beat: Beat) {
    const beatKey = beat.dbId ?? beat.id;
    const confirmed = window.confirm(`Eliminar "${beat.name}" del catálogo? Esta acción ocultará el beat, no borrará el archivo del bucket.`);

    if (!confirmed) {
      return;
    }

    setDeletingBeatId(beatKey);
    setActionMessage("");

    const result = await deleteBeatAsAdmin(beatKey);

    setActionMessage(result.message);

    if (result.ok) {
      await addChangeEvent({
        action: "Beat ocultado",
        eventType: "beat_hidden",
        beat: beat.name,
        description: `Se ocultó ${beat.name} del catálogo público.`,
        commandText: "AdminBeatList.deleteBeat -> is_active=false",
        metadata: { beatId: beatKey, slug: beat.id },
      });
      router.refresh();
      await loadAdminBeats();
    }

    setDeletingBeatId("");
  }

  async function updatePlaybackVisibility(beat: Beat, playbackVisibility: "private" | "public") {
    const beatKey = beat.dbId ?? beat.id;

    if ((beat.playbackVisibility ?? "private") === playbackVisibility) {
      return;
    }

    setUpdatingVisibilityBeatId(beatKey);
    setActionMessage("");

    const result = await updateBeatPlaybackVisibilityAsAdmin(beatKey, playbackVisibility);

    setActionMessage(result.message);

    if (result.ok) {
      await addChangeEvent({
        action: `Reproducción ${playbackVisibility === "public" ? "pública" : "privada"}`,
        eventType: "playback_visibility_update",
        beat: beat.name,
        description: `Reproducción: ${beat.playbackVisibility ?? "private"} → ${playbackVisibility}.`,
        commandText: "AdminBeatList.updatePlaybackVisibility",
        metadata: { beatId: beatKey, previousPlaybackVisibility: beat.playbackVisibility ?? "private", nextPlaybackVisibility: playbackVisibility },
      });
      router.refresh();
      await loadAdminBeats();
    }

    setUpdatingVisibilityBeatId("");
  }

  async function saveMetadata(beat: AdminBeat, field: MetadataField, value: string) {
    const beatKey = beat.dbId ?? beat.id;
    const currentValue = editableValue(beat, field);

    setEditingCell("");

    if (value.trim() === currentValue.trim()) {
      return;
    }

    setSavingBeatId(beatKey);
    setActionMessage("");

    const result = await updateBeatMetadataAsAdmin(beatKey, {
      ...(field === "genre" ? { genre: value } : {}),
      ...(field === "bpm" ? { bpm: value } : {}),
      ...(field === "musicalKey" ? { musicalKey: value } : {}),
    });

    setActionMessage(result.message ?? (result.ok ? "Metadata actualizada." : "No se pudo actualizar la metadata."));

    if (result.ok) {
      await addChangeEvent({
        action: `Metadata: ${metadataFieldLabel(field)}`,
        eventType: "metadata_update",
        beat: beat.name,
        description: `${metadataFieldLabel(field)}: ${formatChangeValue(currentValue)} → ${formatChangeValue(value)}.`,
        commandText: "AdminBeatList.saveMetadata",
        metadata: { beatId: beatKey, field, previousValue: currentValue, nextValue: value },
      });
      router.refresh();
      await loadAdminBeats();
    }

    setSavingBeatId("");
  }

  async function toggleActive(beat: AdminBeat) {
    const beatKey = beat.dbId ?? beat.id;
    const isActive = beat.isActive ?? true;

    setSavingBeatId(beatKey);
    setActionMessage("");

    const result = await updateBeatMetadataAsAdmin(beatKey, { isActive: !isActive });

    setActionMessage(result.message ?? (result.ok ? "Metadata actualizada." : "No se pudo actualizar la metadata."));

    if (result.ok) {
      await addChangeEvent({
        action: !isActive ? "Beat activado" : "Beat desactivado",
        eventType: "active_toggle",
        beat: beat.name,
        description: `Estado: ${isActive ? "Activo" : "Inactivo"} → ${!isActive ? "Activo" : "Inactivo"}.`,
        commandText: "AdminBeatList.toggleActive",
        metadata: { beatId: beatKey, previousIsActive: isActive, nextIsActive: !isActive },
      });
      router.refresh();
      await loadAdminBeats();
    }

    setSavingBeatId("");
  }

  function escapePrintText(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function downloadHistoryPdf() {
    const historyWindow = window.open("", "_blank", "width=840,height=700");

    if (!historyWindow) {
      setActionMessage("No se pudo abrir la ventana de impresión. Revisa el bloqueador de ventanas.");
      return;
    }

    const rows = changeEvents.length
      ? changeEvents
          .map(
            (event) => `
              <tr>
                <td>${escapePrintText(event.block_title)}</td>
                <td>${escapePrintText(event.target_name ?? "Sin objetivo")}</td>
                <td>${escapePrintText(formatChangeDetail(event))}</td>
                <td>${escapePrintText(new Date(event.created_at).toLocaleTimeString())}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="4">Aún no hay cambios registrados en esta sesión.</td></tr>`;

    historyWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Historial de cambios B.R</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { margin: 0 0 20px; color: #4b5563; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Historial de cambios</h1>
          <p>Últimos 7 días · ${changeEvents.length} eventos · ${escapePrintText(new Date().toLocaleString())}</p>
          <table>
            <thead>
              <tr>
                <th>Acción</th>
                <th>Beat</th>
                <th>Cambio</th>
                <th>Hora local</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    historyWindow.document.close();
  }

  function renderEditable(beat: AdminBeat, field: MetadataField, label: string) {
    const cellKey = `${beat.id}-${field}`;
    const isEditing = editingCell === cellKey;
    const value = editableValue(beat, field);

    if (isEditing) {
      return (
        <input
          autoFocus
          type={field === "bpm" ? "number" : "text"}
          min={field === "bpm" ? 40 : undefined}
          max={field === "bpm" ? 240 : undefined}
          value={editingValue}
          onChange={(event) => setEditingValue(event.target.value)}
          onBlur={() => void saveMetadata(beat, field, editingValue)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setEditingCell("");
            }
          }}
          className="h-9 w-full min-w-20 rounded-md border border-cyan-300/40 bg-white/10 px-2 text-sm text-white outline-none"
          aria-label={label}
        />
      );
    }

    return (
      <button
        type="button"
        disabled={savingBeatId === (beat.dbId ?? beat.id)}
        onClick={() => {
          setEditingCell(cellKey);
          setEditingValue(value);
        }}
        className="max-w-36 truncate rounded-md px-2 py-1 text-left text-zinc-300 hover:bg-white/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {value || "Sin dato"}
      </button>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre, slug, género o BPM"
          className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300 md:max-w-lg"
        />
        <span className="text-sm font-semibold text-cyan-200">{filteredBeats.length} / {adminBeats.length} beats</span>
      </div>
      {catalogLoadMessage ? <p className="mb-4 rounded-md border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-100">{catalogLoadMessage}</p> : null}
      {actionMessage ? <p className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">{actionMessage}</p> : null}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-white/[0.06]"
          aria-controls="beat-change-history-panel"
        >
          <span>
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Historial</span>
            <span className="text-[11px] text-zinc-500">Gestión de Beats · 7 días</span>
          </span>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-100">
            {changeEvents.length} eventos
          </span>
        </button>

        {isHistoryOpen ? (
          <div id="beat-change-history-panel" className="mt-2 rounded-lg border border-white/10 bg-[#15181c] p-2">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-zinc-300">Últimos 7 días</p>
              <button
                type="button"
                onClick={downloadHistoryPdf}
                className="h-8 w-fit rounded-md border border-cyan-300/30 px-2.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-300/10"
              >
                Descargar PDF
              </button>
            </div>
            {changeEvents.length ? (
              <div className="grid max-h-24 gap-1.5 overflow-y-auto pr-1">
                {changeEvents.map((event) => (
                  <div key={event.id} className="grid gap-1 rounded-md bg-black/20 px-2 py-1.5 text-[11px] text-zinc-300 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto] sm:items-center">
                    <span className="min-w-0">
                      <span className="block font-semibold text-cyan-100">{event.block_title}</span>
                      <span className="block truncate text-zinc-500">{formatChangeDetail(event)}</span>
                    </span>
                    <span className="truncate">{event.target_name ?? "Sin objetivo"}</span>
                    <span className="text-zinc-500">{new Date(event.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-black/20 px-2 py-1.5 text-[11px] text-zinc-500">Aún no hay cambios registrados.</p>
            )}
          </div>
        ) : null}
      </div>
      <div className="hidden max-h-[58vh] overflow-auto rounded-lg border border-white/10 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#171a1f] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Portada</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Género</th>
              <th className="px-4 py-3">BPM</th>
              <th className="px-4 py-3">Tonalidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Reproducción</th>
              <th className="px-4 py-3">Usuarios con acceso</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredBeats.map((beat) => {
              const usersWithAccess = getUsersWithBeatAccess(beat, localUsers);
              const adminBeat = beat as AdminBeat;
              const isActive = adminBeat.isActive ?? true;

              return (
                <tr key={beat.id} className={`border-t border-white/10 ${isActive ? "" : "bg-red-950/10 opacity-65"}`}>
                  <td className="px-4 py-3">
                    <div className="relative grid h-12 w-12 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-xs font-black">
                      B.R
                      <PlayButton
                        variant="circle"
                        beat={beat}
                        mode="preview"
                        queue={filteredBeats}
                        showPauseState
                        ariaLabel={`Reproducir preview de ${beat.name}`}
                        className="absolute inset-0 h-full w-full bg-black/45 text-cyan-100 hover:bg-black/65"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{beat.name}</td>
                  <td className="px-4 py-3">{renderEditable(adminBeat, "genre", `Editar género de ${beat.name}`)}</td>
                  <td className="px-4 py-3">{renderEditable(adminBeat, "bpm", `Editar BPM de ${beat.name}`)}</td>
                  <td className="px-4 py-3">{renderEditable(adminBeat, "musicalKey", `Editar tonalidad de ${beat.name}`)}</td>
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <AdminBeatStatus status={beat.status} />
                      <button
                        type="button"
                        disabled={savingBeatId === (beat.dbId ?? beat.id)}
                        onClick={() => void toggleActive(adminBeat)}
                        className={`w-fit rounded-full border px-2 py-1 text-xs font-bold ${isActive ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-red-300/30 bg-red-300/10 text-red-100"}`}
                      >
                        {isActive ? "Activo" : "Inactivo"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <PlaybackVisibilityBadge beat={beat} />
                      <label className="sr-only" htmlFor={`playback-visibility-${beat.id}`}>
                        Cambiar reproducción de {beat.name}
                      </label>
                      <select
                        id={`playback-visibility-${beat.id}`}
                        value={beat.playbackVisibility ?? "private"}
                        disabled={updatingVisibilityBeatId === (beat.dbId ?? beat.id)}
                        onChange={(event) => void updatePlaybackVisibility(beat, event.target.value === "public" ? "public" : "private")}
                        className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-xs font-semibold text-white outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="private" className="bg-[#101317] text-white">
                          Privado
                        </option>
                        <option value="public" className="bg-[#101317] text-white">
                          Público
                        </option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {usersWithAccess.length > 0 ? usersWithAccess.map((user) => user.name).join(", ") : "Sin usuarios"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/beats/${beat.id}/preview-editor`}
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200"
                      >
                        <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                        Editar Preview
                      </Link>
                      <button
                        type="button"
                        disabled={deletingBeatId === (beat.dbId ?? beat.id)}
                        onClick={() => void deleteBeat(beat)}
                        className="inline-flex items-center gap-2 rounded-md border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        {deletingBeatId === (beat.dbId ?? beat.id) ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1 md:hidden">
        {filteredBeats.map((beat) => {
          const adminBeat = beat as AdminBeat;
          const isActive = adminBeat.isActive ?? true;

          return (
          <article key={beat.id} className={`rounded-lg border border-white/10 bg-[#15181c] p-4 ${isActive ? "" : "opacity-65"}`}>
            <div className="flex items-start gap-3">
              <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-xs font-black">
                B.R
                <PlayButton
                  variant="circle"
                  beat={beat}
                  mode="preview"
                  queue={filteredBeats}
                  showPauseState
                  ariaLabel={`Reproducir preview de ${beat.name}`}
                  className="absolute inset-0 h-full w-full bg-black/45 text-cyan-100 hover:bg-black/65"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{beat.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {renderEditable(adminBeat, "genre", `Editar género de ${beat.name}`)}
                  {renderEditable(adminBeat, "bpm", `Editar BPM de ${beat.name}`)}
                  {renderEditable(adminBeat, "musicalKey", `Editar tonalidad de ${beat.name}`)}
                  <button
                    type="button"
                    disabled={savingBeatId === (beat.dbId ?? beat.id)}
                    onClick={() => void toggleActive(adminBeat)}
                    className={`rounded-md border px-2 py-1 text-xs font-bold ${isActive ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-red-300/30 bg-red-300/10 text-red-100"}`}
                  >
                    {isActive ? "Activo" : "Inactivo"}
                  </button>
                </div>
                <div className="mt-3">
                  <AdminBeatStatus status={beat.status} />
                </div>
                <div className="mt-2 grid gap-2">
                  <PlaybackVisibilityBadge beat={beat} />
                  <label className="sr-only" htmlFor={`mobile-playback-visibility-${beat.id}`}>
                    Cambiar reproducción de {beat.name}
                  </label>
                  <select
                    id={`mobile-playback-visibility-${beat.id}`}
                    value={beat.playbackVisibility ?? "private"}
                    disabled={updatingVisibilityBeatId === (beat.dbId ?? beat.id)}
                    onChange={(event) => void updatePlaybackVisibility(beat, event.target.value === "public" ? "public" : "private")}
                    className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="private" className="bg-[#101317] text-white">
                      Privado
                    </option>
                    <option value="public" className="bg-[#101317] text-white">
                      Público
                    </option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Usuarios con acceso:{" "}
                  {getUsersWithBeatAccess(beat, localUsers).map((user) => user.name).join(", ") || "Sin usuarios"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                href={`/admin/beats/${beat.id}/preview-editor`}
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Editar Preview
              </Link>
              <button
                type="button"
                disabled={deletingBeatId === (beat.dbId ?? beat.id)}
                onClick={() => void deleteBeat(beat)}
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-red-300/30 text-sm font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deletingBeatId === (beat.dbId ?? beat.id) ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
