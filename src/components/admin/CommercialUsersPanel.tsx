"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CreditCard, Download, ExternalLink, RefreshCw, UserRound, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CommercialUser = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  total_access_beats: number;
  total_paid_beats: number;
  pending_payment_beats: number;
  mp3_download_count: number;
  license_download_count: number;
  total_paid_amount: number;
};

type PaymentBeatOption = {
  id: string;
  title: string | null;
  slug: string | null;
  genre: string | null;
  bpm: number | null;
};

type EarningsSummary = {
  total: number;
  current_month: number;
  current_month_key: string;
  history: Array<{
    month: string;
    amount: number;
  }>;
};

type CommercialSummary = {
  top_active_users: Array<{
    id: string;
    email: string;
    username: string | null;
    display_name: string | null;
    activity_count: number;
    mp3_download_count: number;
    license_download_count: number;
    total_paid_beats: number;
    total_paid_amount: number;
  }>;
  top_downloaded_beats: Array<{
    beat_id: string;
    beat_title: string | null;
    beat_slug: string | null;
    mp3: number;
    licenses: number;
    total_downloads: number;
  }>;
  total_mp3_downloads: number;
  total_license_downloads: number;
  total_manual_payments: number;
};

type TopActiveUser = CommercialSummary["top_active_users"][number];
type TopDownloadedBeat = CommercialSummary["top_downloaded_beats"][number];

type DetailDock = { type: "user"; user: CommercialUser } | null;

const initialForm = {
  beat_id: "",
  amount: "",
  currency: "MXN",
  payment_method: "",
  note: "",
};

const emptyCommercialSummary: CommercialSummary = {
  top_active_users: [],
  top_downloaded_beats: [],
  total_mp3_downloads: 0,
  total_license_downloads: 0,
  total_manual_payments: 0,
};


function userLabel(user: CommercialUser) {
  return user.display_name || user.username || user.email || user.id;
}

function summaryUserLabel(user: CommercialSummary["top_active_users"][number]) {
  return user.display_name || user.username || user.email || user.id;
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function formatMonthLabel(monthKey: string) {
  if (monthKey === "unknown") {
    return "Sin fecha";
  }

  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return date.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

export function CommercialUsersPanel() {
  const [users, setUsers] = useState<CommercialUser[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({
    total: 0,
    current_month: 0,
    current_month_key: "",
    history: [],
  });
  const [summary, setSummary] = useState<CommercialSummary>(emptyCommercialSummary);
  const [isEarningsHistoryOpen, setIsEarningsHistoryOpen] = useState(false);
  const [isTopUsersOpen, setIsTopUsersOpen] = useState(false);
  const [isTopBeatsOpen, setIsTopBeatsOpen] = useState(false);
  const [selectedTopUser, setSelectedTopUser] = useState<TopActiveUser | null>(null);
  const [selectedTopBeat, setSelectedTopBeat] = useState<TopDownloadedBeat | null>(null);
  const [selectedUser, setSelectedUser] = useState<CommercialUser | null>(null);
  const [detailDock, setDetailDock] = useState<DetailDock>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [beatOptions, setBeatOptions] = useState<PaymentBeatOption[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBeat = useMemo(() => beatOptions.find((beat) => beat.id === form.beat_id) ?? null, [beatOptions, form.beat_id]);

  async function getToken() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return { token: "", message: "Supabase no está configurado." };
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";

    return { token, message: token ? "" : "Sesión no válida." };
  }

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setMessage("");

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setMessage(tokenMessage);
        return;
      }

      const response = await fetch("/api/admin/commercial-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudieron cargar los usuarios comerciales.");
        return;
      }

      setUsers(payload.users ?? []);
      setEarnings(payload.earnings ?? { total: 0, current_month: 0, current_month_key: "", history: [] });
      setSummary(payload.summary ?? emptyCommercialSummary);
    } catch {
      setMessage("No se pudieron cargar los usuarios comerciales.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadBeatOptions = useCallback(async (userId: string) => {
    setIsLoadingOptions(true);
    setMessage("");

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setMessage(tokenMessage);
        return;
      }

      const response = await fetch(`/api/admin/manual-payment-options?userId=${encodeURIComponent(userId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudieron cargar los beats pendientes.");
        setBeatOptions([]);
        return;
      }

      setBeatOptions(payload.beats ?? []);
      setForm(initialForm);
    } catch {
      setMessage("No se pudieron cargar los beats pendientes.");
      setBeatOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  function selectUser(user: CommercialUser) {
    setSelectedUser(user);
    setDetailDock({ type: "user", user });
    setIsPaymentFormOpen(false);
    setBeatOptions([]);
    setForm(initialForm);
    void loadBeatOptions(user.id);
  }

  function closeDock() {
    setDetailDock(null);
    setSelectedUser(null);
    setIsPaymentFormOpen(false);
    setBeatOptions([]);
    setForm(initialForm);
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPayment() {
    if (!selectedUser || isSaving) {
      return;
    }

    if (!form.beat_id) {
      setMessage("Selecciona un beat pendiente de pago.");
      return;
    }

    setIsSaving(true);
    setMessage("Registrando pago...");

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setMessage(tokenMessage);
        return;
      }

      const response = await fetch("/api/admin/manual-payment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          beat_id: form.beat_id,
          amount: form.amount,
          currency: form.currency,
          payment_method: form.payment_method,
          note: form.note,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudo registrar el pago.");
        return;
      }

      setMessage(payload.message ?? "Pago registrado.");
      setForm(initialForm);
      await Promise.all([loadUsers(), loadBeatOptions(selectedUser.id)]);
      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
    } catch {
      setMessage("No se pudo registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  }

  function downloadMonthlyStatement(month: string, amount: number) {
    window.location.assign(`/admin/reports/earnings/${encodeURIComponent(month)}?amount=${encodeURIComponent(String(amount))}`);
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadUsers]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Usuarios comerciales</p>
          <h2 className="mt-1 text-base font-bold">Pagos por usuario</h2>
        </div>
        <button type="button" onClick={() => void loadUsers()} className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
          <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-w-0">
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
          <p className="text-xs font-bold uppercase text-cyan-200">Ganancias este mes</p>
          <p className="mt-1 text-lg font-black text-cyan-100">{money(earnings.current_month)}</p>
          <p className="mt-1 text-xs text-zinc-500">{earnings.current_month_key ? formatMonthLabel(earnings.current_month_key) : "Mes actual"}</p>
        </div>

        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
          <p className="text-xs font-bold uppercase text-emerald-200">Ganancias totales</p>
          <p className="mt-1 text-lg font-black text-emerald-100">{money(earnings.total)}</p>
          <p className="mt-1 text-xs text-zinc-500">Pagos manuales registrados</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:col-span-3 xl:col-span-1 2xl:col-span-1">
          <p className="text-xs font-bold uppercase text-zinc-500">Historial de ganancias</p>
          <p className="mt-1 text-lg font-black text-zinc-100">{earnings.history.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Meses con pagos registrados</p>
          <button
            type="button"
            onClick={() => setIsEarningsHistoryOpen(true)}
            className="mt-2 inline-flex h-8 items-center rounded-md border border-white/10 px-2.5 text-[11px] font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
          >
            Ver historial
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500">MP3 total</p>
          <p className="mt-1 text-base font-black text-cyan-100">{summary.total_mp3_downloads}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Licencias total</p>
          <p className="mt-1 text-base font-black text-cyan-100">{summary.total_license_downloads}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Pagos total</p>
          <p className="mt-1 text-base font-black text-emerald-100">{summary.total_manual_payments}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <button type="button" onClick={() => setIsTopUsersOpen((current) => !current)} className="flex w-full items-center justify-between gap-2 text-left">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">Top usuarios</p>
              <p className="text-[11px] text-zinc-500">Actividad comercial</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {isTopUsersOpen ? <ChevronDown className="h-3 w-3" aria-hidden="true" /> : <ChevronRight className="h-3 w-3" aria-hidden="true" />}
              {summary.top_active_users.length}
            </span>
          </button>
          {isTopUsersOpen ? (
            <div className="mt-2 max-h-40 overflow-auto pr-1">
              <div className="flex min-w-max gap-1.5 xl:grid xl:min-w-0 xl:grid-cols-1">
                {summary.top_active_users.length === 0 ? <p className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">Sin actividad de usuarios.</p> : null}
                {summary.top_active_users.map((user) => {
                  return (
                    <button key={user.id} type="button" onClick={() => setSelectedTopUser(user)} className={`w-44 shrink-0 rounded-md border bg-black/20 px-2 py-1.5 text-left text-[10px] text-zinc-300 hover:border-cyan-300/40 xl:w-full ${selectedTopUser?.id === user.id ? "border-cyan-300/50" : "border-white/10"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-cyan-100">{summaryUserLabel(user)}</p>
                        <span className="shrink-0 text-zinc-500">{user.activity_count}</span>
                      </div>
                      <p className="mt-0.5 truncate text-zinc-500">MP3 {user.mp3_download_count} · Lic {user.license_download_count} · Pagos {user.total_paid_beats}</p>
                    </button>
                  );
                })}
              </div>
              {selectedTopUser ? (
                <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-cyan-300/20 bg-cyan-300/10 p-2 text-[11px]">
                  <p className="truncate font-bold text-cyan-100">{summaryUserLabel(selectedTopUser)}</p>
                  <p className="truncate text-zinc-400">{selectedTopUser.email}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-zinc-300">
                    <span>Actividad: {selectedTopUser.activity_count}</span>
                    <span>MP3: {selectedTopUser.mp3_download_count}</span>
                    <span>Licencias: {selectedTopUser.license_download_count}</span>
                    <span>Pagos: {selectedTopUser.total_paid_beats}</span>
                  </div>
                  <p className="mt-1 font-bold text-emerald-100">Total pagado: {money(selectedTopUser.total_paid_amount)}</p>
                  {users.find((item) => item.id === selectedTopUser.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const user = users.find((item) => item.id === selectedTopUser.id);
                        if (user) {
                          selectUser(user);
                        }
                      }}
                      className="mt-2 h-8 rounded-md border border-cyan-300/30 px-2 text-[11px] font-bold text-cyan-100 hover:bg-cyan-300/10"
                    >
                      Seleccionar usuario
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <button type="button" onClick={() => setIsTopBeatsOpen((current) => !current)} className="flex w-full items-center justify-between gap-2 text-left">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">Top beats</p>
              <p className="text-[11px] text-zinc-500">Descargas MP3 / licencias</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
              {isTopBeatsOpen ? <ChevronDown className="h-3 w-3" aria-hidden="true" /> : <ChevronRight className="h-3 w-3" aria-hidden="true" />}
              {summary.top_downloaded_beats.length}
            </span>
          </button>
          {isTopBeatsOpen ? (
            <div className="mt-2 max-h-40 overflow-auto pr-1">
              <div className="flex min-w-max gap-1.5 xl:grid xl:min-w-0 xl:grid-cols-1">
                {summary.top_downloaded_beats.length === 0 ? <p className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">Sin beats descargados.</p> : null}
                {summary.top_downloaded_beats.map((beat) => {
                  const content = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-emerald-100">{beat.beat_title || beat.beat_slug || beat.beat_id}</p>
                        <span className="shrink-0 text-zinc-500">{beat.total_downloads}</span>
                      </div>
                      <p className="mt-0.5 truncate text-zinc-500">MP3 {beat.mp3} · Licencias {beat.licenses}</p>
                    </>
                  );

                  return (
                    <button key={beat.beat_id} type="button" onClick={() => setSelectedTopBeat(beat)} className={`w-44 shrink-0 rounded-md border bg-black/20 px-2 py-1.5 text-left text-[10px] text-zinc-300 hover:border-emerald-300/40 xl:w-full ${selectedTopBeat?.beat_id === beat.beat_id ? "border-emerald-300/50" : "border-white/10"}`}>
                      {content}
                    </button>
                  );
                })}
              </div>
              {selectedTopBeat ? (
                <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-emerald-300/20 bg-emerald-300/10 p-2 text-[11px]">
                  <p className="truncate font-bold text-emerald-100">{selectedTopBeat.beat_title || selectedTopBeat.beat_slug || selectedTopBeat.beat_id}</p>
                  <p className="truncate text-zinc-400">{selectedTopBeat.beat_slug || selectedTopBeat.beat_id}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-zinc-300">
                    <span>Total: {selectedTopBeat.total_downloads}</span>
                    <span>MP3: {selectedTopBeat.mp3}</span>
                    <span>Lic: {selectedTopBeat.licenses}</span>
                  </div>
                  {selectedTopBeat.beat_slug ? (
                    <Link href={`/beats/${selectedTopBeat.beat_slug}`} className="mt-2 inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300/30 px-2 text-[11px] font-bold text-emerald-100 hover:bg-emerald-300/10">
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      Link público
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isEarningsHistoryOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#101317] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-cyan-200">Finanzas B.R</p>
                <h3 className="mt-2 text-xl font-black">Historial de ganancias</h3>
                <p className="mt-1 text-sm text-zinc-500">Estados de cuenta mensuales basados en pagos manuales registrados.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEarningsHistoryOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:border-cyan-300 hover:text-cyan-200"
                aria-label="Cerrar historial de ganancias"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {earnings.history.length === 0 ? <p className="rounded-md border border-white/10 p-4 text-sm text-zinc-400">Sin pagos registrados.</p> : null}
              {earnings.history.map((item) => (
                <div key={item.month} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{formatMonthLabel(item.month)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Total mensual: {money(item.amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadMonthlyStatement(item.month, item.amount)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/20 px-4 text-xs font-bold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-300/10"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Descargar PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-3 rounded-md border border-cyan-300/20 bg-cyan-950/20 p-2 text-xs font-semibold text-cyan-100">{message}</p> : null}

      <div className="mt-3 grid max-h-[360px] gap-1.5 overflow-y-auto pr-1">
        {users.length === 0 ? <p className="rounded-md border border-white/10 p-2.5 text-xs text-zinc-400">Sin usuarios comerciales todavía.</p> : null}

        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => selectUser(user)}
            className={`rounded-lg border p-2.5 text-left transition ${
              selectedUser?.id === user.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/[0.03] hover:border-cyan-300/40"
            }`}
          >
            <div className="grid gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <p className="truncate font-bold">{userLabel(user)}</p>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] 2xl:grid-cols-5">
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">Acceso: {user.total_access_beats}</span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">Pagados: {user.total_paid_beats}</span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-cyan-100">Pendientes: {user.pending_payment_beats}</span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">MP3: {user.mp3_download_count}</span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">Licencias: {user.license_download_count}</span>
              </div>
            </div>

            <p className="mt-1.5 text-[10px] font-semibold text-zinc-500">Total registrado: {money(user.total_paid_amount)}</p>
          </button>
        ))}
      </div>

        </div>

        <aside className="min-h-[520px] rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),#0b0f13] p-4 shadow-2xl shadow-black/20">
          {!detailDock ? (
            <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-white/10 bg-black/15 p-6 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Detalle comercial</p>
                <h3 className="mt-2 text-2xl font-black text-white">Selecciona un usuario</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  El detalle de usuarios normales se ancla aquí para revisar pagos, accesos, descargas y licencias.
                </p>
              </div>
            </div>
          ) : null}

          {detailDock?.type === "user" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Usuario comercial</p>
                  <h3 className="mt-2 truncate text-2xl font-black text-white">{userLabel(detailDock.user)}</h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">{detailDock.user.email}</p>
                </div>
                <button type="button" onClick={closeDock} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:border-cyan-300 hover:text-cyan-200" aria-label="Cerrar detalle">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-emerald-200">Total registrado</p>
                  <p className="mt-2 text-xl font-black text-emerald-100">{money(detailDock.user.total_paid_amount)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Pagos completos</p>
                  <p className="mt-2 text-xl font-black text-white">{detailDock.user.total_paid_beats}</p>
                </div>
                <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-amber-200">Pagos pendientes</p>
                  <p className="mt-2 text-xl font-black text-amber-100">{detailDock.user.pending_payment_beats}</p>
                </div>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-cyan-200">Acceso total</p>
                  <p className="mt-2 text-xl font-black text-cyan-100">{detailDock.user.total_access_beats}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">MP3 descargados</p>
                  <p className="mt-2 text-xl font-black text-cyan-100">{detailDock.user.mp3_download_count}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Licencias</p>
                  <p className="mt-2 text-xl font-black text-cyan-100">{detailDock.user.license_download_count}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setIsPaymentFormOpen((current) => !current)} className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {isPaymentFormOpen ? "Ocultar registro" : "Registro manual"}
                </button>
                {isLoadingOptions ? <p className="text-xs text-zinc-400">Cargando beats pendientes...</p> : null}
              </div>

              {isPaymentFormOpen ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">Beat pendiente de pago</span>
                      <select value={form.beat_id} onChange={(event) => updateField("beat_id", event.target.value)} className="h-9 rounded-md border border-white/10 bg-[#15181c] px-3 text-sm outline-none focus:border-cyan-300">
                        <option value="">{beatOptions.length === 0 ? "Sin beats pendientes" : "Selecciona un beat"}</option>
                        {beatOptions.map((beat) => (
                          <option key={beat.id} value={beat.id}>
                            {beat.title || beat.slug || beat.id} {beat.genre ? `- ${beat.genre}` : ""} {beat.bpm ? `- ${beat.bpm} BPM` : ""}
                          </option>
                        ))}
                      </select>
                      {selectedBeat ? <span className="text-xs text-zinc-500">ID: {selectedBeat.id}</span> : null}
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-zinc-300">Monto</span>
                      <input value={form.amount} onChange={(event) => updateField("amount", event.target.value)} type="number" min="0" step="0.01" className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="1500.00" />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-zinc-300">Moneda</span>
                      <input value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="MXN" maxLength={3} />
                    </label>

                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">Método</span>
                      <input value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)} className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Transferencia, efectivo..." />
                    </label>

                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">Nota</span>
                      <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} className="min-h-16 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Referencia o nota interna" />
                    </label>
                  </div>

                  <button type="button" onClick={() => void submitPayment()} disabled={isSaving || !form.beat_id || beatOptions.length === 0} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    {isSaving ? "Guardando..." : "Registrar pago"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
