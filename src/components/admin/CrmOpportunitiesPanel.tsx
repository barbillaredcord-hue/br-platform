"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { formatLocalDateTime } from "@/lib/formatLocalDateTime";
import type {
  CrmOpportunityRow,
  OpportunitySource,
  OpportunityStatus,
} from "@/lib/crm/opportunities";
import {
  OPPORTUNITY_SOURCE_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  formatOpportunityValue,
  getOpportunityUiActions,
  isOpportunityRequestBeatCoherent,
  resolveOpportunityRequestBeat,
  selectOpportunityUiSections,
  type OpportunityUiAction,
} from "@/lib/crm/opportunities-ui";

type TokenResult = { token: string; message: string };

type OpportunityView = CrmOpportunityRow & {
  profile_label: string;
};

type OpportunitySummary = {
  openCount: number;
  qualifiedCount: number;
  proposalCount: number;
  wonCount: number;
  lostCount: number;
  pipelineByCurrency: Record<string, number>;
};

type BeatOption = {
  id: string;
  title: string | null;
  slug: string | null;
};

type AccessRequestOption = {
  id: string;
  beat_id: string | null;
  status: string | null;
  created_at: string | null;
};

type OpportunitiesPayload = {
  opportunities: OpportunityView[];
  summary: OpportunitySummary;
  options: {
    beats: BeatOption[];
    access_requests: AccessRequestOption[];
  };
};

type OpportunityFormState = {
  title: string;
  source: OpportunitySource;
  beatId: string;
  accessRequestId: string;
  estimatedValue: string;
  currency: string;
  summary: string;
};

const EMPTY_FORM: OpportunityFormState = {
  title: "",
  source: "manual",
  beatId: "",
  accessRequestId: "",
  estimatedValue: "",
  currency: "",
  summary: "",
};

const fieldClass =
  "w-full rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60";

const statusClasses: Record<OpportunityStatus, string> = {
  open: "bg-cyan-300/15 text-cyan-100",
  qualified: "bg-blue-300/15 text-blue-100",
  proposal: "bg-indigo-300/15 text-indigo-100",
  closed_won: "bg-emerald-300/15 text-emerald-100",
  closed_lost: "bg-amber-200/10 text-amber-100",
};

function beatLabel(beat: BeatOption | undefined) {
  return beat?.title || beat?.slug || "Beat no disponible";
}

function requestLabel(
  request: AccessRequestOption | undefined,
  beatById: ReadonlyMap<string, BeatOption>,
) {
  if (!request) {
    return "Solicitud no disponible";
  }

  const beat = request.beat_id ? beatById.get(request.beat_id) : undefined;
  const context = request.beat_id ? beatLabel(beat) : "Sin beat";
  return `${context} · ${request.status || "Sin estado"} · ${formatLocalDateTime(request.created_at)}`;
}

function parseEstimatedValue(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${statusClasses[status]}`}>
      {OPPORTUNITY_STATUS_LABELS[status]}
    </span>
  );
}

function OpportunityCard({
  opportunity,
  beat,
  onOpen,
}: {
  opportunity: OpportunityView;
  beat: BeatOption | undefined;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-md border border-white/10 bg-black/15 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-100">{opportunity.title}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {OPPORTUNITY_SOURCE_LABELS[opportunity.source]}
            {opportunity.beat_id ? ` · ${beatLabel(beat)}` : " · Sin beat"}
          </p>
        </div>
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <span className="rounded bg-white/5 px-2 py-1">
          {formatOpportunityValue(opportunity.estimated_value, opportunity.currency)}
        </span>
        <span>Actualizada {formatLocalDateTime(opportunity.updated_at)}</span>
      </div>

      {opportunity.summary ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
          {opportunity.summary}
        </p>
      ) : null}

      {opportunity.profile_id === null ? (
        <p className="mt-2 text-xs font-bold text-amber-100">Perfil eliminado</p>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 text-xs font-bold text-cyan-200 hover:text-cyan-100"
      >
        Ver detalle
      </button>
    </article>
  );
}

export function CrmOpportunitiesPanel({
  profileId,
  getToken,
}: {
  profileId: string;
  getToken: () => Promise<TokenResult>;
}) {
  const [data, setData] = useState<OpportunitiesPayload | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<OpportunityFormState>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OpportunityFormState>(EMPTY_FORM);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setIsError(true);
        setMessage(tokenMessage);
        return false;
      }

      const query = new URLSearchParams({
        profile_id: profileId,
        include_archived: "true",
      });
      const response = await fetch(`/api/admin/crm/opportunities?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setIsError(true);
        setMessage(payload?.message ?? "No se pudieron cargar las oportunidades.");
        return false;
      }

      setData({
        opportunities: payload.opportunities as OpportunityView[],
        summary: payload.summary as OpportunitySummary,
        options: payload.options as OpportunitiesPayload["options"],
      });
      return true;
    } catch {
      setIsError(true);
      setMessage("No se pudieron cargar las oportunidades.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(null);
      setMessage("");
      setIsError(false);
      setSelectedId(null);
      setEditingId(null);
      setIsCreating(false);
      setCreateForm(EMPTY_FORM);
      void loadOpportunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOpportunities]);

  const opportunities = useMemo(
    () => data?.opportunities ?? [],
    [data?.opportunities],
  );
  const sections = useMemo(
    () => selectOpportunityUiSections(opportunities),
    [opportunities],
  );
  const beatById = useMemo(
    () => new Map((data?.options.beats ?? []).map((beat) => [beat.id, beat])),
    [data?.options.beats],
  );
  const requestById = useMemo(
    () => new Map((data?.options.access_requests ?? []).map((request) => [request.id, request])),
    [data?.options.access_requests],
  );
  const selected = selectedId
    ? opportunities.find((opportunity) => opportunity.id === selectedId) ?? null
    : null;
  const operationalCount =
    (data?.summary.openCount ?? 0)
    + (data?.summary.qualifiedCount ?? 0)
    + (data?.summary.proposalCount ?? 0)
    + (data?.summary.wonCount ?? 0)
    + (data?.summary.lostCount ?? 0);
  const pipelineEntries = Object.entries(data?.summary.pipelineByCurrency ?? {})
    .sort(([left], [right]) => left.localeCompare(right));

  function showMessage(nextMessage: string, error = false) {
    setMessage(nextMessage);
    setIsError(error);
  }

  function updateCreateForm(patch: Partial<OpportunityFormState>) {
    setCreateForm((current) => ({ ...current, ...patch }));
  }

  function updateEditForm(patch: Partial<OpportunityFormState>) {
    setEditForm((current) => ({ ...current, ...patch }));
  }

  function selectCreateSource(source: OpportunitySource) {
    updateCreateForm({
      source,
      accessRequestId: source === "access_request" ? createForm.accessRequestId : "",
    });
  }

  function selectCreateRequest(requestId: string) {
    const request = requestById.get(requestId);
    updateCreateForm({
      accessRequestId: requestId,
      beatId: request
        ? resolveOpportunityRequestBeat(createForm.beatId, request.beat_id)
        : createForm.beatId,
    });
  }

  async function authorizedFetch(url: string, init: RequestInit) {
    const { token, message: tokenMessage } = await getToken();

    if (!token) {
      throw new Error(tokenMessage);
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.message ?? "No se pudo completar la operación.");
    }

    return payload;
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingId) {
      return;
    }

    const selectedRequest = createForm.accessRequestId
      ? requestById.get(createForm.accessRequestId)
      : undefined;

    if (createForm.source === "access_request" && !selectedRequest) {
      showMessage("Selecciona una solicitud de acceso del contacto.", true);
      return;
    }

    if (
      selectedRequest
      && !isOpportunityRequestBeatCoherent(
        createForm.beatId || null,
        selectedRequest.beat_id,
      )
    ) {
      showMessage("El beat debe coincidir con la solicitud seleccionada.", true);
      return;
    }

    setSavingId("create");
    showMessage("");

    try {
      const payload = await authorizedFetch("/api/admin/crm/opportunities", {
        method: "POST",
        body: JSON.stringify({
          profile_id: profileId,
          title: createForm.title,
          source: createForm.source,
          beat_id: createForm.beatId || null,
          access_request_id:
            createForm.source === "access_request"
              ? createForm.accessRequestId || null
              : null,
          estimated_value: parseEstimatedValue(createForm.estimatedValue),
          currency: createForm.estimatedValue.trim()
            ? createForm.currency.toUpperCase()
            : null,
          summary: createForm.summary || null,
        }),
      });

      setCreateForm(EMPTY_FORM);
      setIsCreating(false);
      setSelectedId(payload.opportunity.id as string);
      if (await loadOpportunities()) {
        showMessage("Oportunidad creada correctamente.");
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "No se pudo crear la oportunidad.",
        true,
      );
    } finally {
      setSavingId(null);
    }
  }

  function startEditing(opportunity: OpportunityView) {
    setEditingId(opportunity.id);
    setEditForm({
      title: opportunity.title,
      source: opportunity.source,
      beatId: opportunity.beat_id ?? "",
      accessRequestId: opportunity.access_request_id ?? "",
      estimatedValue:
        opportunity.estimated_value === null
          ? ""
          : String(opportunity.estimated_value),
      currency: opportunity.currency ?? "",
      summary: opportunity.summary ?? "",
    });
    showMessage("");
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId || savingId) {
      return;
    }

    const opportunity = opportunities.find((row) => row.id === editingId);
    const request = opportunity?.access_request_id
      ? requestById.get(opportunity.access_request_id)
      : undefined;

    if (
      request
      && !isOpportunityRequestBeatCoherent(editForm.beatId || null, request.beat_id)
    ) {
      showMessage("El beat debe coincidir con la solicitud vinculada.", true);
      return;
    }

    setSavingId(editingId);
    showMessage("");

    try {
      await authorizedFetch(
        `/api/admin/crm/opportunities/${encodeURIComponent(editingId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "update",
            title: editForm.title,
            summary: editForm.summary || null,
            beat_id: editForm.beatId || null,
            estimated_value: parseEstimatedValue(editForm.estimatedValue),
            currency: editForm.estimatedValue.trim()
              ? editForm.currency.toUpperCase()
              : null,
          }),
        },
      );

      setEditingId(null);
      if (await loadOpportunities()) {
        showMessage("Oportunidad actualizada.");
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "No se pudo actualizar la oportunidad.",
        true,
      );
    } finally {
      setSavingId(null);
    }
  }

  async function runAction(
    opportunity: OpportunityView,
    action: OpportunityUiAction | { action: "archive" },
  ) {
    if (savingId) {
      return;
    }

    setSavingId(opportunity.id);
    showMessage("");

    try {
      const body = action.action === "change_status"
        ? { action: action.action, status: action.status }
        : { action: action.action };
      await authorizedFetch(
        `/api/admin/crm/opportunities/${encodeURIComponent(opportunity.id)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );

      if (action.action === "archive") {
        setPendingArchiveId(null);
        setSelectedId(null);
      }

      if (await loadOpportunities()) {
        showMessage(
          action.action === "close_won"
            ? "Oportunidad cerrada como ganada."
            : action.action === "close_lost"
              ? "Oportunidad cerrada como perdida."
              : action.action === "reopen"
                ? "Oportunidad reabierta."
                : action.action === "archive"
                  ? "Oportunidad archivada."
                  : "Estado actualizado.",
        );
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "No se pudo actualizar la oportunidad.",
        true,
      );
    } finally {
      setSavingId(null);
    }
  }

  const renderCards = (rows: readonly CrmOpportunityRow[]) => (
    <div className="grid gap-2 lg:grid-cols-2">
      {rows.map((row) => {
        const opportunity = row as OpportunityView;
        return (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            beat={opportunity.beat_id ? beatById.get(opportunity.beat_id) : undefined}
            onOpen={() => {
              setSelectedId(opportunity.id);
              setEditingId(null);
              showMessage("");
            }}
          />
        );
      })}
    </div>
  );

  return (
    <section className="space-y-3 border-t border-white/10 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Oportunidades</p>
          <p className="text-xs text-zinc-400">Pipeline potencial; los ingresos reales continúan en pagos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void loadOpportunities()}
            className="text-xs font-bold text-zinc-300 hover:text-cyan-100 disabled:opacity-50"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating((current) => !current);
              showMessage("");
            }}
            className="rounded-md bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/25"
          >
            Nueva oportunidad
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <p className="text-xs text-zinc-400">Cargando oportunidades…</p>
      ) : null}

      {isCreating ? (
        <form onSubmit={submitCreate} className="space-y-3 rounded-md border border-cyan-300/20 bg-black/20 p-3">
          <p className="text-xs font-bold uppercase text-cyan-100">Nueva oportunidad</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Título</span>
              <input
                required
                minLength={3}
                maxLength={160}
                value={createForm.title}
                onChange={(event) => updateCreateForm({ title: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Origen</span>
              <select
                value={createForm.source}
                onChange={(event) => selectCreateSource(event.target.value as OpportunitySource)}
                className={fieldClass}
              >
                {Object.entries(OPPORTUNITY_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Beat opcional</span>
              <select
                value={createForm.beatId}
                onChange={(event) => updateCreateForm({ beatId: event.target.value })}
                className={fieldClass}
              >
                <option value="">Sin beat</option>
                {(data?.options.beats ?? []).map((beat) => (
                  <option key={beat.id} value={beat.id}>{beatLabel(beat)}</option>
                ))}
              </select>
            </label>
            {createForm.source === "access_request" ? (
              <label className="space-y-1 text-xs text-zinc-300">
                <span>Solicitud de acceso</span>
                <select
                  required
                  value={createForm.accessRequestId}
                  onChange={(event) => selectCreateRequest(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Selecciona una solicitud</option>
                  {(data?.options.access_requests ?? []).map((request) => (
                    <option key={request.id} value={request.id}>
                      {requestLabel(request, beatById)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Valor estimado</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createForm.estimatedValue}
                onChange={(event) => updateCreateForm({ estimatedValue: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Moneda {createForm.estimatedValue.trim() ? "(obligatoria)" : ""}</span>
              <input
                required={Boolean(createForm.estimatedValue.trim())}
                maxLength={3}
                placeholder="MXN"
                value={createForm.currency}
                onChange={(event) => updateCreateForm({ currency: event.target.value.toUpperCase() })}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-zinc-300">
            <span>Resumen</span>
            <textarea
              maxLength={2000}
              rows={3}
              value={createForm.summary}
              onChange={(event) => updateCreateForm({ summary: event.target.value })}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={savingId === "create"} className="rounded bg-cyan-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
              {savingId === "create" ? "Creando…" : "Crear oportunidad"}
            </button>
            <button type="button" disabled={savingId === "create"} onClick={() => setIsCreating(false)} className="rounded border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {data && operationalCount > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
            {[
              ["Abiertas", data.summary.openCount],
              ["Calificadas", data.summary.qualifiedCount],
              ["En propuesta", data.summary.proposalCount],
              ["Ganadas", data.summary.wonCount],
              ["Perdidas", data.summary.lostCount],
            ].map(([label, count]) => (
              <div key={label} className="rounded border border-white/10 bg-white/[0.03] p-2">
                <p className="text-zinc-500">{label}</p>
                <p className="mt-1 text-lg font-black text-zinc-100">{count}</p>
              </div>
            ))}
          </div>

          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-bold text-zinc-200">Pipeline estimado</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {pipelineEntries.length ? pipelineEntries.map(([currency, amount]) => (
                <span key={currency} className="rounded bg-cyan-300/10 px-2 py-1 font-bold text-cyan-100">
                  {formatOpportunityValue(amount, currency)}
                </span>
              )) : <span className="text-zinc-500">Sin valor estimado registrado.</span>}
            </div>
          </div>
        </>
      ) : null}

      {data && sections.active.length === 0 && sections.closed.length === 0 ? (
        <div className="rounded border border-dashed border-white/10 p-3 text-xs text-zinc-400">
          <p>No hay oportunidades registradas para este contacto.</p>
          <button type="button" onClick={() => setIsCreating(true)} className="mt-2 font-bold text-cyan-200 hover:text-cyan-100">
            Nueva oportunidad
          </button>
        </div>
      ) : null}

      {sections.active.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-200">Oportunidades activas</p>
          {renderCards(sections.active)}
        </div>
      ) : null}

      {sections.closed.length ? (
        <details className="rounded-md border border-white/10 bg-black/10 p-3">
          <summary className="cursor-pointer text-xs font-bold text-zinc-200">
            Historial de oportunidades ({sections.closed.length})
          </summary>
          <div className="mt-3">{renderCards(sections.closed)}</div>
        </details>
      ) : null}

      <details className="rounded-md border border-white/10 bg-black/10 p-3">
        <summary className="cursor-pointer text-xs font-bold text-zinc-300">
          Ver archivadas ({sections.archived.length})
        </summary>
        <div className="mt-3">
          {sections.archived.length
            ? renderCards(sections.archived)
            : <p className="text-xs text-zinc-500">No hay oportunidades archivadas.</p>}
        </div>
      </details>

      {selected ? (
        <article className="space-y-3 rounded-md border border-cyan-300/25 bg-cyan-300/[0.04] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-zinc-100">{selected.title}</p>
              <p className="mt-1 text-xs text-zinc-400">Detalle de oportunidad</p>
            </div>
            <div className="flex items-center gap-2">
              <OpportunityStatusBadge status={selected.status} />
              <button type="button" onClick={() => setSelectedId(null)} className="text-xs text-zinc-400 hover:text-zinc-100">Cerrar</button>
            </div>
          </div>

          {selected.profile_id === null ? <p className="text-xs font-bold text-amber-100">Perfil eliminado</p> : null}

          <dl className="grid gap-2 text-xs text-zinc-300 sm:grid-cols-2">
            <div><dt className="text-zinc-500">Origen</dt><dd>{OPPORTUNITY_SOURCE_LABELS[selected.source]}</dd></div>
            <div><dt className="text-zinc-500">Beat</dt><dd>{selected.beat_id ? beatLabel(beatById.get(selected.beat_id)) : "Sin beat"}</dd></div>
            <div><dt className="text-zinc-500">Solicitud vinculada</dt><dd>{selected.access_request_id ? requestLabel(requestById.get(selected.access_request_id), beatById) : "Sin solicitud"}</dd></div>
            <div><dt className="text-zinc-500">Valor estimado</dt><dd>{formatOpportunityValue(selected.estimated_value, selected.currency)}</dd></div>
            <div><dt className="text-zinc-500">Creada</dt><dd>{formatLocalDateTime(selected.created_at)}</dd></div>
            <div><dt className="text-zinc-500">Actualizada</dt><dd>{formatLocalDateTime(selected.updated_at)}</dd></div>
            {selected.closed_at ? <div><dt className="text-zinc-500">Cerrada</dt><dd>{formatLocalDateTime(selected.closed_at)}</dd></div> : null}
            {selected.archived_at ? <div><dt className="text-zinc-500">Archivada</dt><dd>{formatLocalDateTime(selected.archived_at)}</dd></div> : null}
          </dl>

          {selected.summary ? <p className="whitespace-pre-wrap text-xs leading-5 text-zinc-300">{selected.summary}</p> : null}

          {editingId === selected.id ? (
            <form onSubmit={submitEdit} className="space-y-3 border-t border-white/10 pt-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs text-zinc-300">
                  <span>Título</span>
                  <input required minLength={3} maxLength={160} value={editForm.title} onChange={(event) => updateEditForm({ title: event.target.value })} className={fieldClass} />
                </label>
                <label className="space-y-1 text-xs text-zinc-300">
                  <span>Beat</span>
                  <select disabled={Boolean(selected.access_request_id)} value={editForm.beatId} onChange={(event) => updateEditForm({ beatId: event.target.value })} className={fieldClass}>
                    <option value="">Sin beat</option>
                    {(data?.options.beats ?? []).map((beat) => <option key={beat.id} value={beat.id}>{beatLabel(beat)}</option>)}
                  </select>
                  {selected.access_request_id ? <span className="block text-zinc-500">El beat queda fijado por la solicitud vinculada.</span> : null}
                </label>
                <label className="space-y-1 text-xs text-zinc-300">
                  <span>Valor estimado</span>
                  <input type="number" min="0" step="0.01" value={editForm.estimatedValue} onChange={(event) => updateEditForm({ estimatedValue: event.target.value })} className={fieldClass} />
                </label>
                <label className="space-y-1 text-xs text-zinc-300">
                  <span>Moneda</span>
                  <input required={Boolean(editForm.estimatedValue.trim())} maxLength={3} placeholder="MXN" value={editForm.currency} onChange={(event) => updateEditForm({ currency: event.target.value.toUpperCase() })} className={fieldClass} />
                </label>
              </div>
              <label className="block space-y-1 text-xs text-zinc-300">
                <span>Resumen</span>
                <textarea maxLength={2000} rows={3} value={editForm.summary} onChange={(event) => updateEditForm({ summary: event.target.value })} className={fieldClass} />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={savingId === selected.id} className="rounded bg-cyan-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">Guardar cambios</button>
                <button type="button" disabled={savingId === selected.id} onClick={() => setEditingId(null)} className="rounded border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50">Cancelar</button>
              </div>
            </form>
          ) : null}

          {!selected.archived_at && editingId !== selected.id ? (
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              <button type="button" disabled={Boolean(savingId)} onClick={() => startEditing(selected)} className="rounded border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 disabled:opacity-50">Editar</button>
              {getOpportunityUiActions(selected.status).map((action) => (
                <button
                  key={`${action.action}-${action.action === "change_status" ? action.status : ""}`}
                  type="button"
                  disabled={Boolean(savingId)}
                  onClick={() => void runAction(selected, action)}
                  className={`rounded px-3 py-2 text-xs font-bold disabled:opacity-50 ${action.action === "close_won" ? "bg-emerald-300/20 text-emerald-100" : "border border-white/10 text-zinc-200"}`}
                >
                  {action.label}
                </button>
              ))}
              <button type="button" disabled={Boolean(savingId)} onClick={() => setPendingArchiveId(selected.id)} className="rounded px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-50">Archivar</button>
            </div>
          ) : null}

          {pendingArchiveId === selected.id ? (
            <div className="flex flex-wrap items-center gap-2 rounded border border-amber-200/15 bg-amber-200/5 p-2 text-xs text-amber-100">
              <span>¿Archivar esta oportunidad?</span>
              <button type="button" disabled={Boolean(savingId)} onClick={() => void runAction(selected, { action: "archive" })} className="rounded bg-amber-100/15 px-2 py-1 font-bold disabled:opacity-50">Confirmar</button>
              <button type="button" disabled={Boolean(savingId)} onClick={() => setPendingArchiveId(null)} className="px-2 py-1 text-zinc-300 disabled:opacity-50">Cancelar</button>
            </div>
          ) : null}
        </article>
      ) : null}

      {message ? (
        <p className={`text-xs ${isError ? "text-amber-200" : "text-cyan-100"}`} role={isError ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
