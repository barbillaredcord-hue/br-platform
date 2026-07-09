"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAdminChangeLog, deleteBeatAsAdmin, getAdminChangeLogs, getProfilesResult, updateBeatMetadataAsAdmin, updateBeatPlaybackVisibilityAsAdmin, type AdminChangeLog } from "@/lib/supabase/queries";
import { PlayButton } from "../PlayButton";

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
  const [selectedBeatId, setSelectedBeatId] = useState("");

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

  const beatStats = useMemo(() => {
    const activeBeats = adminBeats.filter((beat) => (beat as AdminBeat).isActive ?? true);
    const publicBeats = adminBeats.filter((beat) => beat.playbackVisibility === "public");

    return {
      total: adminBeats.length,
      active: activeBeats.length,
      public: publicBeats.length,
      private: adminBeats.length - publicBeats.length,
    };
  }, [adminBeats]);

  const topAccessBeats = useMemo(() => {
    return [...adminBeats]
      .map((beat) => ({ beat, usersWithAccess: getUsersWithBeatAccess(beat, localUsers) }))
      .sort((firstBeat, secondBeat) => secondBeat.usersWithAccess.length - firstBeat.usersWithAccess.length)
      .slice(0, 5);
  }, [adminBeats, localUsers]);

  const selectedBeat = useMemo(() => {
    return filteredBeats.find((beat) => beat.id === selectedBeatId || beat.dbId === selectedBeatId) ?? filteredBeats[0] ?? null;
  }, [filteredBeats, selectedBeatId]);

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

  const selectedAdminBeat = selectedBeat as AdminBeat | null;
  const selectedUsersWithAccess = selectedBeat ? getUsersWithBeatAccess(selectedBeat, localUsers) : [];

  return (
    <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="min-w-0 rounded-xl border border-white/10 bg-[#101317] p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
            <p className="text-[10px] font-bold uppercase text-cyan-200">Total</p>
            <p className="mt-1 text-2xl font-black text-cyan-100">{beatStats.total}</p>
          </div>
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
            <p className="text-[10px] font-bold uppercase text-emerald-200">Activos</p>
            <p className="mt-1 text-2xl font-black text-emerald-100">{beatStats.active}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/4 p-3">
            <p className="text-[10px] font-bold uppercase text-zinc-500">Públicos</p>
            <p className="mt-1 text-2xl font-black text-white">{beatStats.public}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-bold uppercase text-zinc-500">Privados</p>
            <p className="mt-1 text-2xl font-black text-white">{beatStats.private}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-white/3 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">Top acceso</p>
          <div className="mt-2 grid max-h-40 gap-1.5 overflow-y-auto pr-1">
            {topAccessBeats.map(({ beat, usersWithAccess }) => (
              <button
                key={beat.id}
                type="button"
                onClick={() => setSelectedBeatId(beat.id)}
                className="rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-left text-[11px] hover:border-cyan-300/40"
              >
                <span className="block truncate font-bold text-zinc-100">{beat.name}</span>
                <span className="text-zinc-500">{usersWithAccess.length} usuarios con acceso</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/3 px-2.5 py-1.5 text-left transition hover:border-cyan-300/40 hover:bg-white/6"
            aria-controls="beat-change-history-panel"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Historial</span>
              <span className="text-[11px] text-zinc-500">Últimos 7 días</span>
            </span>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[11px] font-bold text-cyan-100">
              {changeEvents.length}
            </span>
          </button>

          {isHistoryOpen ? (
            <div id="beat-change-history-panel" className="mt-1.5 rounded-md border border-white/10 bg-[#15181c] p-1.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-300">Cambios</p>
                <button type="button" onClick={downloadHistoryPdf} className="h-7 rounded-md border border-cyan-300/30 px-2 text-[10px] font-bold text-cyan-100 hover:bg-cyan-300/10">
                  PDF
                </button>
              </div>
              {changeEvents.length ? (
                <div className="grid max-h-40 gap-1 overflow-y-auto pr-1">
                  {changeEvents.map((event) => (
                    <div key={event.id} className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-300">
                      <p className="truncate font-semibold text-cyan-100">{event.block_title}</p>
                      <p className="truncate text-zinc-500">{event.target_name ?? "Sin objetivo"} · {formatChangeDetail(event)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">Aún no hay cambios registrados.</p>
              )}
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 rounded-xl border border-white/10 bg-[#101317] p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="relative md:max-w-md md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar beats, slug, género o BPM"
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <span className="text-xs font-semibold text-cyan-200">{filteredBeats.length} / {adminBeats.length} beats</span>
        </div>

        {catalogLoadMessage ? <p className="mt-3 rounded-md border border-red-300/20 bg-red-950/20 p-2 text-xs text-red-100">{catalogLoadMessage}</p> : null}
        {actionMessage ? <p className="mt-3 rounded-md border border-white/10 bg-white/5 p-2 text-xs text-zinc-300">{actionMessage}</p> : null}

        <div className="mt-3 hidden max-h-[66vh] overflow-auto rounded-lg border border-white/10 md:block">
          <table className="w-full min-w-230 border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#171a1f] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Beat</th>
                <th className="px-3 py-2">Género</th>
                <th className="px-3 py-2">BPM</th>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Reproducción</th>
                <th className="px-3 py-2">Acceso</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeats.map((beat) => {
                const usersWithAccess = getUsersWithBeatAccess(beat, localUsers);
                const adminBeat = beat as AdminBeat;
                const isActive = adminBeat.isActive ?? true;
                const isSelected = selectedBeat?.id === beat.id;

                return (
                  <tr
                    key={beat.id}
                    onClick={() => setSelectedBeatId(beat.id)}
                    className={`cursor-pointer border-t border-white/10 transition hover:bg-white/4 ${isSelected ? "bg-cyan-300/10" : ""} ${isActive ? "" : "bg-red-950/10 opacity-70"}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-[10px] font-black">
                          B.R
                          <PlayButton variant="circle" beat={beat} mode="preview" queue={filteredBeats} showPauseState ariaLabel={`Reproducir preview de ${beat.name}`} className="absolute inset-0 h-full w-full bg-black/45 text-cyan-100 hover:bg-black/65" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-zinc-100">{beat.name}</p>
                          <p className="truncate text-[11px] text-zinc-500">{beat.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{renderEditable(adminBeat, "genre", `Editar género de ${beat.name}`)}</td>
                    <td className="px-3 py-2">{renderEditable(adminBeat, "bpm", `Editar BPM de ${beat.name}`)}</td>
                    <td className="px-3 py-2">{renderEditable(adminBeat, "musicalKey", `Editar tonalidad de ${beat.name}`)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={savingBeatId === (beat.dbId ?? beat.id)}
                        onClick={() => void toggleActive(adminBeat)}
                        className={`rounded-full border px-2 py-1 text-[11px] font-bold ${isActive ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-red-300/30 bg-red-300/10 text-red-100"}`}
                      >
                        {isActive ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        aria-label={`Cambiar reproducción de ${beat.name}`}
                        title={`Cambiar reproducción de ${beat.name}`}
                        value={beat.playbackVisibility ?? "private"}
                        disabled={updatingVisibilityBeatId === (beat.dbId ?? beat.id)}
                        onChange={(event) => void updatePlaybackVisibility(beat, event.target.value === "public" ? "public" : "private")}
                        className="h-8 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-white outline-none focus:border-cyan-300 disabled:opacity-50"
                      >
                        <option value="private" className="bg-[#101317] text-white">Privado</option>
                        <option value="public" className="bg-[#101317] text-white">Público</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{usersWithAccess.length}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/admin/beats/${beat.id}/preview-editor`} className="inline-flex h-8 items-center gap-1 rounded-md bg-cyan-300 px-2 text-[11px] font-bold text-black hover:bg-cyan-200">
                          <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                          Preview
                        </Link>
                        <button type="button" disabled={deletingBeatId === (beat.dbId ?? beat.id)} onClick={() => void deleteBeat(beat)} className="inline-flex h-8 items-center gap-1 rounded-md border border-red-300/30 px-2 text-[11px] font-bold text-red-100 hover:bg-red-300/10 disabled:opacity-50">
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          {deletingBeatId === (beat.dbId ?? beat.id) ? "..." : "Ocultar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid max-h-[62vh] gap-2 overflow-y-auto pr-1 md:hidden">
          {filteredBeats.map((beat) => {
            const adminBeat = beat as AdminBeat;
            const isActive = adminBeat.isActive ?? true;
            const isSelected = selectedBeat?.id === beat.id;

            return (
              <article key={beat.id} onClick={() => setSelectedBeatId(beat.id)} className={`rounded-lg border p-3 ${isSelected ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-[#15181c]"} ${isActive ? "" : "opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-[10px] font-black">
                    B.R
                    <PlayButton variant="circle" beat={beat} mode="preview" queue={filteredBeats} showPauseState ariaLabel={`Reproducir preview de ${beat.name}`} className="absolute inset-0 h-full w-full bg-black/45 text-cyan-100 hover:bg-black/65" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{beat.name}</p>
                    <p className="truncate text-[11px] text-zinc-500">{beat.id}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                      {renderEditable(adminBeat, "genre", `Editar género de ${beat.name}`)}
                      {renderEditable(adminBeat, "bpm", `Editar BPM de ${beat.name}`)}
                      {renderEditable(adminBeat, "musicalKey", `Editar tonalidad de ${beat.name}`)}
                      <button type="button" disabled={savingBeatId === (beat.dbId ?? beat.id)} onClick={() => void toggleActive(adminBeat)} className={`rounded-md border px-2 py-1 text-[11px] font-bold ${isActive ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-red-300/30 bg-red-300/10 text-red-100"}`}>
                        {isActive ? "Activo" : "Inactivo"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="min-w-0 rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),#0b0f13] p-3 xl:sticky xl:top-4 xl:h-fit">
        {selectedBeat && selectedAdminBeat ? (
          <div>
            <div className="grid aspect-square place-items-center rounded-lg bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-4xl font-black text-white/85">
              B.R
            </div>
            <div className="mt-3">
              <h3 className="wrap-break-word text-xl font-black text-white">{selectedBeat.name}</h3>
              <p className="mt-1 break-all text-xs text-zinc-500">{selectedBeat.id}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-200">{selectedBeat.genre}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-200">{selectedBeat.bpm} BPM</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-zinc-200">{selectedBeat.key || "Sin key"}</span>
              <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${(selectedAdminBeat.isActive ?? true) ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-red-300/30 bg-red-300/10 text-red-100"}`}>
                {(selectedAdminBeat.isActive ?? true) ? "Activo" : "Inactivo"}
              </span>
              <PlaybackVisibilityBadge beat={selectedBeat} />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Preview actual</p>
                <audio className="mt-2 w-full" controls src={selectedBeat.previewUrl} />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Full audio</p>
                <audio className="mt-2 w-full" controls src={selectedBeat.fullAudioUrl} />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/3 p-3">
              <p className="text-xs font-bold uppercase text-cyan-200">Usuarios con acceso</p>
              <div className="mt-2 grid max-h-24 gap-1 overflow-y-auto pr-1">
                {selectedUsersWithAccess.length ? (
                  selectedUsersWithAccess.map((user) => <span key={user.id} className="truncate rounded bg-black/20 px-2 py-1 text-xs text-zinc-300">{user.name}</span>)
                ) : (
                  <p className="text-xs text-zinc-500">Sin usuarios con acceso.</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <PlayButton variant="light" beat={selectedBeat} mode="preview" queue={filteredBeats} showPauseState>
                Preview
              </PlayButton>
              <Link href={`/admin/beats/${selectedBeat.id}/preview-editor`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Editar Preview
              </Link>
              <button type="button" disabled={deletingBeatId === (selectedBeat.dbId ?? selectedBeat.id)} onClick={() => void deleteBeat(selectedBeat)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-300/30 text-sm font-bold text-red-100 hover:bg-red-300/10 disabled:opacity-50">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deletingBeatId === (selectedBeat.dbId ?? selectedBeat.id) ? "Ocultando..." : "Ocultar/Eliminar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-lg border border-white/10 bg-black/15 p-6 text-center">
            <p className="text-sm text-zinc-400">Selecciona un beat para ver detalle.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
