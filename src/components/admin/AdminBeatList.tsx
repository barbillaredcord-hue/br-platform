"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteBeatAsAdmin, getProfilesResult, updateBeatMetadataAsAdmin, updateBeatPlaybackVisibilityAsAdmin } from "@/lib/supabase/queries";
import { PlayButton } from "../PlayButton";
import { AdminBeatStatus } from "./AdminBeatStatus";

type AdminBeat = Beat & { isActive?: boolean | null };
type MetadataField = "genre" | "bpm" | "musicalKey";

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

export function AdminBeatList({ beats, users = [] }: { beats: Beat[]; users?: User[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [localUsers, setLocalUsers] = useState(users);
  const [deletingBeatId, setDeletingBeatId] = useState("");
  const [updatingVisibilityBeatId, setUpdatingVisibilityBeatId] = useState("");
  const [editingCell, setEditingCell] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [savingBeatId, setSavingBeatId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const filteredBeats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return beats;
    }

    return beats.filter((beat) => [beat.name, beat.id, beat.genre, String(beat.bpm)].some((value) => value.toLowerCase().includes(term)));
  }, [beats, search]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void getProfilesResult(createSupabaseBrowserClient()).then((result) => {
        if (result.users.length) {
          setLocalUsers(result.users);
        }
      });
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [pathname]);

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
      router.refresh();
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
      router.refresh();
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
      router.refresh();
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
      router.refresh();
    }

    setSavingBeatId("");
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
        <span className="text-sm font-semibold text-cyan-200">{filteredBeats.length} / {beats.length} beats</span>
      </div>
      {actionMessage ? <p className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">{actionMessage}</p> : null}
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
