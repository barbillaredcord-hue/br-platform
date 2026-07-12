"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { grantBeatAccess, revokeBeatAccess } from "@/lib/supabase/queries";

type CommercialPayment = {
  id: string;
  beat_id: string;
  beat_title: string | null;
  beat_slug: string | null;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  note: string | null;
  created_at: string | null;
};

type CommercialAccessBeat = {
  beat_id: string;
  beat_title: string | null;
  beat_slug: string | null;
  genre: string | null;
  bpm: number | null;
  granted_at: string | null;
};

type CommercialRevocation = {
  id: string;
  beat_id: string;
  beat_title: string | null;
  beat_slug: string | null;
  revoked_at: string | null;
  reason: string | null;
  restored_at: string | null;
  status: "revoked" | "restored";
};

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
  payments?: CommercialPayment[];
  active_accesses?: CommercialAccessBeat[];
  revocations?: CommercialRevocation[];
};

type PaymentBeatOption = {
  id: string;
  title: string | null;
  slug: string | null;
  genre: string | null;
  bpm: number | null;
};

type BeatActivityUser = {
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  last_activity_at: string | null;
  count: number;
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
    mp3_users: BeatActivityUser[];
    license_users: BeatActivityUser[];
  }>;
  total_mp3_downloads: number;
  total_license_downloads: number;
  total_manual_payments: number;
};

type TopActiveUser = CommercialSummary["top_active_users"][number];
type TopDownloadedBeat = CommercialSummary["top_downloaded_beats"][number];

type DetailDock =
  | { type: "user"; user: CommercialUser }
  | { type: "beat"; beat: TopDownloadedBeat }
  | null;

type PaymentDateFilter = "today" | "7days" | "30days" | "all";

type UserCommercialSection =
  | "active-accesses"
  | "revocations"
  | "payments"
  | "payment-options";

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

function topBeatLabel(beat: TopDownloadedBeat) {
  return beat.beat_title || beat.beat_slug || beat.beat_id;
}

function findTopBeat(beats: TopDownloadedBeat[], beatId: string) {
  return beats.find((beat) => beat.beat_id === beatId);
}

function beatActivityUserLabel(user: BeatActivityUser) {
  return user.display_name || user.username || user.email || user.user_id;
}

function formatActivityDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const [selectedBeatActivityTab, setSelectedBeatActivityTab] =
    useState<"all" | "mp3" | "licenses">("all");

  const [selectedUser, setSelectedUser] = useState<CommercialUser | null>(null);
  const [detailDock, setDetailDock] = useState<DetailDock>(null);

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [openUserCommercialSection, setOpenUserCommercialSection] =
    useState<UserCommercialSection | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<CommercialPayment | null>(null);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentDateFilter, setPaymentDateFilter] =
    useState<PaymentDateFilter>("all");
  const [paymentFilterReferenceTime] = useState(() => Date.now());
  const [isAccessMutationPending, setIsAccessMutationPending] =
    useState<string | null>(null);

  const [beatOptions, setBeatOptions] = useState<PaymentBeatOption[]>([]);
  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBeat = useMemo(
    () => beatOptions.find((beat) => beat.id === form.beat_id) ?? null,
    [beatOptions, form.beat_id],
  );

  const filteredPayments = useMemo(() => {
    if (detailDock?.type !== "user") {
      return [] as CommercialPayment[];
    }

    const search = paymentSearch.trim().toLocaleLowerCase("es-MX");
    const today = new Date(paymentFilterReferenceTime);
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();

    const minimumDate =
      paymentDateFilter === "today"
        ? startOfToday
        : paymentDateFilter === "7days"
          ? paymentFilterReferenceTime - 7 * 24 * 60 * 60 * 1000
          : paymentDateFilter === "30days"
            ? paymentFilterReferenceTime - 30 * 24 * 60 * 60 * 1000
            : 0;

    return (detailDock.user.payments ?? [])
      .filter((payment) => {
        const createdAt = payment.created_at
          ? new Date(payment.created_at).getTime()
          : 0;
        const matchesDate =
          paymentDateFilter === "all" || createdAt >= minimumDate;

        const searchable = [
          payment.beat_title,
          payment.beat_slug,
          payment.payment_method,
          payment.note,
          String(payment.amount),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-MX");

        return matchesDate && (!search || searchable.includes(search));
      })
      .sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
  }, [detailDock, paymentDateFilter, paymentFilterReferenceTime, paymentSearch]);

  const visibleBeatActivityUsers = useMemo(() => {
    if (detailDock?.type !== "beat") {
      return [] as BeatActivityUser[];
    }

    const usersById = new Map<string, BeatActivityUser>();
    const sourceUsers =
      selectedBeatActivityTab === "all"
        ? [...detailDock.beat.mp3_users, ...detailDock.beat.license_users]
        : selectedBeatActivityTab === "mp3"
          ? detailDock.beat.mp3_users
          : detailDock.beat.license_users;

    sourceUsers.forEach((user) => {
      const existingUser = usersById.get(user.user_id);
      const existingDate = existingUser?.last_activity_at
        ? new Date(existingUser.last_activity_at).getTime()
        : 0;
      const nextDate = user.last_activity_at
        ? new Date(user.last_activity_at).getTime()
        : 0;

      usersById.set(user.user_id, {
        ...user,
        count: (existingUser?.count ?? 0) + user.count,
        last_activity_at:
          nextDate > existingDate
            ? user.last_activity_at
            : existingUser?.last_activity_at ?? user.last_activity_at,
      });
    });

    return Array.from(usersById.values()).sort(
      (firstUser, secondUser) =>
        secondUser.count - firstUser.count ||
        beatActivityUserLabel(firstUser).localeCompare(
          beatActivityUserLabel(secondUser),
        ),
    );
  }, [detailDock, selectedBeatActivityTab]);

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
        setMessage(
          payload?.message ??
            "No se pudieron cargar los usuarios comerciales.",
        );
        return;
      }

      const nextUsers = (payload.users ?? []) as CommercialUser[];
      setUsers(nextUsers);
      setEarnings(
        payload.earnings ?? {
          total: 0,
          current_month: 0,
          current_month_key: "",
          history: [],
        },
      );

      const nextSummary = payload.summary ?? emptyCommercialSummary;
      setSummary(nextSummary);

      setSelectedUser((current) =>
        current
          ? nextUsers.find((user) => user.id === current.id) ?? current
          : current,
      );

      setDetailDock((current) => {
        if (current?.type === "user") {
          const refreshedUser = nextUsers.find(
            (user) => user.id === current.user.id,
          );
          return refreshedUser
            ? { type: "user", user: refreshedUser }
            : current;
        }

        if (current?.type === "beat") {
          const refreshedBeat = findTopBeat(
            nextSummary.top_downloaded_beats,
            current.beat.beat_id,
          );
          return refreshedBeat
            ? { type: "beat", beat: refreshedBeat }
            : current;
        }

        return current;
      });

      setSelectedTopBeat((current) => {
        if (!current) {
          return current;
        }

        return (
          findTopBeat(nextSummary.top_downloaded_beats, current.beat_id) ??
          current
        );
      });
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

      const response = await fetch(
        `/api/admin/manual-payment-options?userId=${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(
          payload?.message ?? "No se pudieron cargar los beats pendientes.",
        );
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

  function resetUserDetailState() {
    setIsPaymentFormOpen(false);
    setOpenUserCommercialSection(null);
    setSelectedPayment(null);
    setPaymentSearch("");
    setPaymentDateFilter("all");
    setIsAccessMutationPending(null);
  }

  function selectUser(user: CommercialUser) {
    setSelectedUser(user);
    setSelectedTopBeat(null);
    setSelectedBeatActivityTab("all");
    setDetailDock({ type: "user", user });
    resetUserDetailState();
    setBeatOptions([]);
    setForm(initialForm);
    void loadBeatOptions(user.id);
  }

  function selectTopBeat(beat: TopDownloadedBeat) {
    setSelectedTopBeat(beat);
    setSelectedBeatActivityTab("all");
    setSelectedTopUser(null);
    setSelectedUser(null);
    setDetailDock({ type: "beat", beat });
    resetUserDetailState();
    setBeatOptions([]);
    setForm(initialForm);
  }

  function closeDock() {
    setDetailDock(null);
    setSelectedUser(null);
    setSelectedTopBeat(null);
    setSelectedBeatActivityTab("all");
    resetUserDetailState();
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
      await Promise.all([
        loadUsers(),
        loadBeatOptions(selectedUser.id),
      ]);
      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
    } catch {
      setMessage("No se pudo registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeTopBeatUserAccess(
    user: BeatActivityUser,
    beat: TopDownloadedBeat,
  ) {
    setMessage(`Revocando acceso de ${beatActivityUserLabel(user)}...`);

    try {
      const result = await revokeBeatAccess(
        user.user_id,
        beat.beat_id,
        `Revocado desde Detalle comercial por actividad en ${topBeatLabel(beat)}.`,
      );

      if (!result.ok) {
        setMessage(result.message ?? "No se pudo revocar el acceso.");
        return;
      }

      setMessage(`Acceso revocado para ${beatActivityUserLabel(user)}.`);
      await loadUsers();

      setDetailDock((current) => {
        if (current?.type !== "beat") {
          return current;
        }

        return {
          type: "beat",
          beat: {
            ...current.beat,
            mp3_users: current.beat.mp3_users.filter(
              (item) => item.user_id !== user.user_id,
            ),
            license_users: current.beat.license_users.filter(
              (item) => item.user_id !== user.user_id,
            ),
          },
        };
      });

      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
      window.dispatchEvent(new Event("br-access-requests-refresh"));
      window.dispatchEvent(new Event("br:revocation-dismissed"));
    } catch {
      setMessage("No se pudo revocar el acceso.");
    }
  }

  async function revokeUserBeatAccess(access: CommercialAccessBeat) {
    if (!selectedUser || isAccessMutationPending) {
      return;
    }

    const pendingKey = `revoke-${access.beat_id}`;
    setIsAccessMutationPending(pendingKey);
    setMessage(
      `Revocando acceso a ${
        access.beat_title || access.beat_slug || access.beat_id
      }...`,
    );

    try {
      const result = await revokeBeatAccess(
        selectedUser.id,
        access.beat_id,
        `Revocado desde el panel comercial de ${userLabel(selectedUser)}.`,
      );

      if (!result.ok) {
        setMessage(result.message ?? "No se pudo revocar el acceso.");
        return;
      }

      await loadUsers();
      setMessage("Acceso revocado correctamente.");
      window.dispatchEvent(new Event("br-access-state-changed"));
      window.dispatchEvent(new Event("br-access-requests-refresh"));
      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
    } catch {
      setMessage("No se pudo revocar el acceso.");
    } finally {
      setIsAccessMutationPending(null);
    }
  }

  async function restoreUserBeatAccess(revocation: CommercialRevocation) {
    if (
      !selectedUser ||
      isAccessMutationPending ||
      revocation.status === "restored"
    ) {
      return;
    }

    const pendingKey = `restore-${revocation.id}`;
    setIsAccessMutationPending(pendingKey);
    setMessage(
      `Restaurando acceso a ${
        revocation.beat_title ||
        revocation.beat_slug ||
        revocation.beat_id
      }...`,
    );

    try {
      const result = await grantBeatAccess(
        selectedUser.id,
        revocation.beat_id,
      );

      if (!result.ok) {
        setMessage(result.message ?? "No se pudo restaurar el acceso.");
        return;
      }

      await loadUsers();
      setMessage("Acceso restaurado correctamente.");
      window.dispatchEvent(new Event("br-access-state-changed"));
      window.dispatchEvent(new Event("br-access-requests-refresh"));
      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
    } catch {
      setMessage("No se pudo restaurar el acceso.");
    } finally {
      setIsAccessMutationPending(null);
    }
  }

  function downloadMonthlyStatement(month: string, amount: number) {
    window.location.assign(
      `/admin/reports/earnings/${encodeURIComponent(
        month,
      )}?amount=${encodeURIComponent(String(amount))}`,
    );
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadUsers]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadUsers();
    };

    window.addEventListener("br-access-state-changed", handleRefresh);
    window.addEventListener("br-access-requests-refresh", handleRefresh);
    window.addEventListener("br-commercial-activity-refresh", handleRefresh);

    return () => {
      window.removeEventListener("br-access-state-changed", handleRefresh);
      window.removeEventListener("br-access-requests-refresh", handleRefresh);
      window.removeEventListener(
        "br-commercial-activity-refresh",
        handleRefresh,
      );
    };
  }, [loadUsers]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">
            Usuarios comerciales
          </p>
          <h2 className="mt-1 text-base font-bold">Pagos por usuario</h2>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isLoadingUsers ? "animate-spin" : ""
            }`}
            aria-hidden="true"
          />
          Actualizar
        </button>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-xs font-bold uppercase text-cyan-200">
                Ganancias este mes
              </p>
              <p className="mt-1 text-lg font-black text-cyan-100">
                {money(earnings.current_month)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {earnings.current_month_key
                  ? formatMonthLabel(earnings.current_month_key)
                  : "Mes actual"}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
              <p className="text-xs font-bold uppercase text-emerald-200">
                Ganancias totales
              </p>
              <p className="mt-1 text-lg font-black text-emerald-100">
                {money(earnings.total)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Pagos manuales registrados
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/3 p-3 sm:col-span-3 xl:col-span-1 2xl:col-span-1">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Historial de ganancias
              </p>
              <p className="mt-1 text-lg font-black text-zinc-100">
                {earnings.history.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Meses con pagos registrados
              </p>
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
              <p className="text-[10px] font-bold uppercase text-zinc-500">
                MP3 total
              </p>
              <p className="mt-1 text-base font-black text-cyan-100">
                {summary.total_mp3_downloads}
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 p-2">
              <p className="text-[10px] font-bold uppercase text-zinc-500">
                Licencias total
              </p>
              <p className="mt-1 text-base font-black text-cyan-100">
                {summary.total_license_downloads}
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 p-2">
              <p className="text-[10px] font-bold uppercase text-zinc-500">
                Pagos total
              </p>
              <p className="mt-1 text-base font-black text-emerald-100">
                {summary.total_manual_payments}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 xl:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/3 p-2.5">
              <button
                type="button"
                onClick={() => setIsTopUsersOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                    Top usuarios
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Actividad comercial
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
                  {isTopUsersOpen ? (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  )}
                  {summary.top_active_users.length}
                </span>
              </button>

              {isTopUsersOpen ? (
                <div className="mt-2 max-h-40 overflow-auto pr-1">
                  <div className="flex min-w-max gap-1.5 xl:grid xl:min-w-0 xl:grid-cols-1">
                    {summary.top_active_users.length === 0 ? (
                      <p className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">
                        Sin actividad de usuarios.
                      </p>
                    ) : null}

                    {summary.top_active_users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedTopUser(user)}
                        className={`w-44 shrink-0 rounded-md border bg-black/20 px-2 py-1.5 text-left text-[10px] text-zinc-300 hover:border-cyan-300/40 xl:w-full ${
                          selectedTopUser?.id === user.id
                            ? "border-cyan-300/50"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-bold text-cyan-100">
                            {summaryUserLabel(user)}
                          </p>
                          <span className="shrink-0 text-zinc-500">
                            {user.activity_count}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-zinc-500">
                          MP3 {user.mp3_download_count} · Lic{" "}
                          {user.license_download_count} · Pagos{" "}
                          {user.total_paid_beats}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedTopUser ? (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-cyan-300/20 bg-cyan-300/10 p-2 text-[11px]">
                      <p className="truncate font-bold text-cyan-100">
                        {summaryUserLabel(selectedTopUser)}
                      </p>
                      <p className="truncate text-zinc-400">
                        {selectedTopUser.email}
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-1 text-zinc-300">
                        <span>
                          Actividad: {selectedTopUser.activity_count}
                        </span>
                        <span>MP3: {selectedTopUser.mp3_download_count}</span>
                        <span>
                          Licencias: {selectedTopUser.license_download_count}
                        </span>
                        <span>Pagos: {selectedTopUser.total_paid_beats}</span>
                      </div>

                      <p className="mt-1 font-bold text-emerald-100">
                        Total pagado:{" "}
                        {money(selectedTopUser.total_paid_amount)}
                      </p>

                      {users.find(
                        (item) => item.id === selectedTopUser.id,
                      ) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const user = users.find(
                              (item) => item.id === selectedTopUser.id,
                            );
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

            <div className="rounded-lg border border-white/10 bg-white/3 p-2.5">
              <button
                type="button"
                onClick={() => setIsTopBeatsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                    Top beats
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Descargas MP3 / licencias
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                  {isTopBeatsOpen ? (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  )}
                  {summary.top_downloaded_beats.length}
                </span>
              </button>

              {isTopBeatsOpen ? (
                <div className="mt-2 max-h-40 overflow-auto pr-1">
                  <div className="flex min-w-max gap-1.5 xl:grid xl:min-w-0 xl:grid-cols-1">
                    {summary.top_downloaded_beats.length === 0 ? (
                      <p className="rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">
                        Sin beats descargados.
                      </p>
                    ) : null}

                    {summary.top_downloaded_beats.map((beat) => (
                      <button
                        key={beat.beat_id}
                        type="button"
                        onClick={() => selectTopBeat(beat)}
                        className={`w-44 shrink-0 rounded-md border bg-black/20 px-2 py-1.5 text-left text-[10px] text-zinc-300 hover:border-emerald-300/40 xl:w-full ${
                          selectedTopBeat?.beat_id === beat.beat_id
                            ? "border-emerald-300/50"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-bold text-emerald-100">
                            {topBeatLabel(beat)}
                          </p>
                          <span className="shrink-0 text-zinc-500">
                            {beat.total_downloads}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-zinc-500">
                          MP3 {beat.mp3} · Licencias {beat.licenses}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedTopBeat ? (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-emerald-300/20 bg-emerald-300/10 p-2 text-[11px]">
                      <p className="truncate font-bold text-emerald-100">
                        {topBeatLabel(selectedTopBeat)}
                      </p>
                      <p className="truncate text-zinc-400">
                        {selectedTopBeat.beat_slug ||
                          selectedTopBeat.beat_id}
                      </p>

                      <div className="mt-2 grid grid-cols-3 gap-1 text-zinc-300">
                        <span>Total: {selectedTopBeat.total_downloads}</span>
                        <span>MP3: {selectedTopBeat.mp3}</span>
                        <span>Lic: {selectedTopBeat.licenses}</span>
                      </div>

                      {selectedTopBeat.beat_slug ? (
                        <Link
                          href={`/beats/${selectedTopBeat.beat_slug}`}
                          className="mt-2 inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300/30 px-2 text-[11px] font-bold text-emerald-100 hover:bg-emerald-300/10"
                        >
                          <ExternalLink
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Link público
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {message ? (
            <p className="mt-3 rounded-md border border-cyan-300/20 bg-cyan-950/20 p-2 text-xs font-semibold text-cyan-100">
              {message}
            </p>
          ) : null}

          <div className="mt-3 grid max-h-90 gap-1.5 overflow-y-auto pr-1">
            {users.length === 0 ? (
              <p className="rounded-md border border-white/10 p-2.5 text-xs text-zinc-400">
                Sin usuarios comerciales todavía.
              </p>
            ) : null}

            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectUser(user)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  selectedUser?.id === user.id
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-white/3 hover:border-cyan-300/40"
                }`}
              >
                <div className="grid gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserRound
                        className="h-4 w-4 text-cyan-200"
                        aria-hidden="true"
                      />
                      <p className="truncate font-bold">{userLabel(user)}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] 2xl:grid-cols-5">
                    <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                      Acceso: {user.total_access_beats}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                      Pagados: {user.total_paid_beats}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-1 text-cyan-100">
                      Pendientes: {user.pending_payment_beats}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                      MP3: {user.mp3_download_count}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                      Licencias: {user.license_download_count}
                    </span>
                  </div>
                </div>

                <p className="mt-1.5 text-[10px] font-semibold text-zinc-500">
                  Total registrado: {money(user.total_paid_amount)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <aside className="min-h-130 rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),#0b0f13] p-4 shadow-2xl shadow-black/20">
          {!detailDock ? (
            <div className="grid h-full min-h-105 place-items-center rounded-lg border border-white/10 bg-black/15 p-6 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Detalle comercial
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  Selecciona un usuario o top beat
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  El detalle comercial se ancla aquí para revisar pagos,
                  accesos, descargas, licencias y actividad por beat.
                </p>
              </div>
            </div>
          ) : null}

          {detailDock?.type === "user" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    Usuario comercial
                  </p>
                  <h3 className="mt-2 truncate text-2xl font-black text-white">
                    {userLabel(detailDock.user)}
                  </h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {detailDock.user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDock}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:border-cyan-300 hover:text-cyan-200"
                  aria-label="Cerrar detalle"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-emerald-200">
                    Total registrado
                  </p>
                  <p className="mt-2 text-xl font-black text-emerald-100">
                    {money(detailDock.user.total_paid_amount)}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/4 p-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    Pagos completos
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {detailDock.user.total_paid_beats}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-amber-200">
                    Pagos pendientes
                  </p>
                  <p className="mt-2 text-xl font-black text-amber-100">
                    {detailDock.user.pending_payment_beats}
                  </p>
                </div>

                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <p className="text-[10px] font-bold uppercase text-cyan-200">
                    Acceso total
                  </p>
                  <p className="mt-2 text-xl font-black text-cyan-100">
                    {detailDock.user.total_access_beats}
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_45%),rgba(8,12,16,0.92)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-[0_22px_55px_rgba(0,0,0,0.34)]">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    MP3 descargados
                  </p>
                  <p className="mt-2 text-xl font-black text-cyan-100">
                    {detailDock.user.mp3_download_count}
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_45%),rgba(8,12,16,0.92)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-[0_22px_55px_rgba(0,0,0,0.34)]">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    Licencias
                  </p>
                  <p className="mt-2 text-xl font-black text-cyan-100">
                    {detailDock.user.license_download_count}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(
                  [
                    {
                      id: "active-accesses",
                      title: "Accesos activos",
                      description:
                        "Beats disponibles actualmente para este usuario.",
                      count: detailDock.user.active_accesses?.length ?? 0,
                      color: "cyan",
                    },
                    {
                      id: "revocations",
                      title: "Revocaciones históricas",
                      description:
                        "Historial conservado aunque el acceso sea restaurado.",
                      count: detailDock.user.revocations?.length ?? 0,
                      color: "amber",
                    },
                    {
                      id: "payments",
                      title: "Pagos registrados",
                      description: "Historial de pagos manuales del usuario.",
                      count: detailDock.user.payments?.length ?? 0,
                      color: "emerald",
                    },
                    {
                      id: "payment-options",
                      title: "Disponibles para pago",
                      description:
                        "Beats pendientes que pueden registrarse manualmente.",
                      count: beatOptions.length,
                      color: "cyan",
                    },
                  ] as const
                ).map((section) => {
                  const isActive = openUserCommercialSection === section.id;
                  const colorClasses = {
                    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
                    amber:
                      "border-amber-300/20 bg-amber-300/10 text-amber-100",
                    emerald:
                      "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
                  }[section.color];

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        setOpenUserCommercialSection((current) =>
                          current === section.id ? null : section.id,
                        )
                      }
                      className={`flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition ${colorClasses} ${
                        isActive
                          ? "ring-2 ring-cyan-300/60"
                          : "hover:border-white/30"
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase">
                          {section.title}
                        </p>
                        <p className="text-xs leading-5 text-zinc-400">
                          {section.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xl font-black">
                        {isActive ? (
                          <ChevronDown className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        )}
                        {section.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {openUserCommercialSection === "active-accesses" ? (
                <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3">
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid gap-2">
                      {(detailDock.user.active_accesses?.length ?? 0) === 0 ? (
                        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
                          Sin accesos activos.
                        </p>
                      ) : null}
                      {(detailDock.user.active_accesses ?? []).map((access) => (
                        <article key={access.beat_id} className="rounded-md border border-white/10 bg-white/5 p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {access.beat_title || access.beat_slug || access.beat_id}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {access.genre || "Sin género"} · {access.bpm ? `${access.bpm} BPM` : "BPM sin definir"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void revokeUserBeatAccess(access)}
                              disabled={Boolean(isAccessMutationPending)}
                              className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300/30 px-3 text-xs font-bold text-amber-100 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isAccessMutationPending === `revoke-${access.beat_id}` ? "Revocando..." : "Revocar acceso"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {openUserCommercialSection === "revocations" ? (
                <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid gap-2">
                      {(detailDock.user.revocations?.length ?? 0) === 0 ? (
                        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">Sin revocaciones históricas.</p>
                      ) : null}
                      {(detailDock.user.revocations ?? []).map((revocation) => (
                        <article key={revocation.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {revocation.beat_title || revocation.beat_slug || revocation.beat_id}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">Fecha: {formatActivityDate(revocation.revoked_at)}</p>
                              <p className="mt-1 text-xs text-zinc-400">Motivo: {revocation.reason || "Sin motivo registrado"}</p>
                              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${revocation.status === "restored" ? "border-emerald-300/30 text-emerald-100" : "border-amber-300/30 text-amber-100"}`}>
                                {revocation.status === "restored" ? "Acceso restaurado" : "Revocado"}
                              </span>
                            </div>
                            {revocation.status !== "restored" ? (
                              <button
                                type="button"
                                onClick={() => void restoreUserBeatAccess(revocation)}
                                disabled={Boolean(isAccessMutationPending)}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-300/30 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isAccessMutationPending === `restore-${revocation.id}` ? "Restaurando..." : "Volver a dar acceso"}
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {openUserCommercialSection === "payments" ? (
                <div className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-3">
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <input
                      value={paymentSearch}
                      onChange={(event) => setPaymentSearch(event.target.value)}
                      className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                      placeholder="Buscar por beat, método, nota o monto"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[["today", "Hoy"], ["7days", "7 días"], ["30days", "30 días"], ["all", "Todos"]].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentDateFilter(value as PaymentDateFilter)}
                          className={`h-8 rounded-md border px-3 text-[11px] font-bold ${paymentDateFilter === value ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/10 text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {filteredPayments.length === 0 ? (
                        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">No hay pagos que coincidan con la búsqueda o filtro.</p>
                      ) : null}
                      {filteredPayments.map((payment) => (
                        <article key={payment.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">{payment.beat_title || payment.beat_slug || payment.beat_id}</p>
                              <p className="mt-1 text-xs font-bold text-emerald-100">{money(payment.amount)}</p>
                              <p className="mt-1 text-xs text-zinc-500">{formatActivityDate(payment.created_at)} · {payment.payment_method || "Método sin registrar"}</p>
                              <p className="mt-1 truncate text-xs text-zinc-400">{payment.note || "Sin nota"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedPayment(payment)}
                              className="inline-flex h-9 items-center justify-center rounded-md border border-cyan-300/30 px-3 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10"
                            >
                              Ver detalle
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {openUserCommercialSection === "payment-options" ? (
                <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3">
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid gap-2">
                      {isLoadingOptions ? (
                        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">Cargando beats pendientes...</p>
                      ) : null}
                      {!isLoadingOptions && beatOptions.length === 0 ? (
                        <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">Sin beats pendientes de pago.</p>
                      ) : null}
                      {beatOptions.map((beat) => (
                        <button
                          key={beat.id}
                          type="button"
                          onClick={() => {
                            updateField("beat_id", beat.id);
                            setIsPaymentFormOpen(true);
                          }}
                          className={`rounded-md border p-3 text-left transition ${form.beat_id === beat.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:border-cyan-300/40"}`}
                        >
                          <p className="truncate text-sm font-bold text-white">{beat.title || beat.slug || beat.id}</p>
                          <p className="mt-1 text-xs text-zinc-500">{beat.genre || "Sin género"} · {beat.bpm ? `${beat.bpm} BPM` : "BPM sin definir"}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {openUserCommercialSection === "payments" && selectedPayment ? (
                <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-emerald-200">
                        Detalle de pago
                      </p>
                      <h4 className="mt-2 truncate text-lg font-black text-white">
                        {selectedPayment.beat_title ||
                          selectedPayment.beat_slug ||
                          selectedPayment.beat_id}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:border-emerald-300 hover:text-emerald-100"
                      aria-label="Cerrar detalle de pago"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                    <p>
                      <span className="text-zinc-500">Monto:</span>{" "}
                      {money(selectedPayment.amount)}
                    </p>
                    <p>
                      <span className="text-zinc-500">Fecha:</span>{" "}
                      {formatActivityDate(selectedPayment.created_at)}
                    </p>
                    <p>
                      <span className="text-zinc-500">Método:</span>{" "}
                      {selectedPayment.payment_method || "Sin registrar"}
                    </p>
                    <p>
                      <span className="text-zinc-500">Moneda:</span>{" "}
                      {selectedPayment.currency || "MXN"}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-zinc-500">Nota:</span>{" "}
                      {selectedPayment.note || "Sin nota"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentFormOpen((current) => !current)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200"
              >
                 <CreditCard className="h-4 w-4" aria-hidden="true" />
                 {isPaymentFormOpen ? "Ocultar registro" : "Registro manual"}
              </button>

                {isLoadingOptions ? (
                  <p className="text-xs text-zinc-400">
                    Cargando beats pendientes...
                  </p>
                ) : null}
              </div>

              {isPaymentFormOpen ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">
                        Beat pendiente de pago
                      </span>

                      <select
                        value={form.beat_id}
                        onChange={(event) =>
                          updateField("beat_id", event.target.value)
                        }
                        className="h-9 rounded-md border border-white/10 bg-[#15181c] px-3 text-sm outline-none focus:border-cyan-300"
                      >
                        <option value="">
                          {beatOptions.length === 0
                            ? "Sin beats pendientes"
                            : "Selecciona un beat"}
                        </option>

                        {beatOptions.map((beat) => (
                          <option key={beat.id} value={beat.id}>
                            {beat.title || beat.slug || beat.id}{" "}
                            {beat.genre ? `- ${beat.genre}` : ""}{" "}
                            {beat.bpm ? `- ${beat.bpm} BPM` : ""}
                          </option>
                        ))}
                      </select>

                      {selectedBeat ? (
                        <span className="text-xs text-zinc-500">
                          ID: {selectedBeat.id}
                        </span>
                      ) : null}
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-zinc-300">
                        Monto
                      </span>

                      <input
                        value={form.amount}
                        onChange={(event) =>
                          updateField("amount", event.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                        placeholder="1500.00"
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-sm font-semibold text-zinc-300">
                        Moneda
                      </span>

                      <input
                        value={form.currency}
                        onChange={(event) =>
                          updateField(
                            "currency",
                            event.target.value.toUpperCase(),
                          )
                        }
                        className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                        placeholder="MXN"
                        maxLength={3}
                      />
                    </label>

                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">
                        Método
                      </span>

                      <input
                        value={form.payment_method}
                        onChange={(event) =>
                          updateField(
                            "payment_method",
                            event.target.value,
                          )
                        }
                        className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                        placeholder="Transferencia, efectivo..."
                      />
                    </label>

                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-sm font-semibold text-zinc-300">
                        Nota
                      </span>

                      <textarea
                        value={form.note}
                        onChange={(event) =>
                          updateField("note", event.target.value)
                        }
                        className="min-h-16 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-cyan-300"
                        placeholder="Referencia o nota interna"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitPayment()}
                    disabled={
                      isSaving ||
                      !form.beat_id ||
                      beatOptions.length === 0
                    }
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CreditCard
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    {isSaving ? "Guardando..." : "Registrar pago"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {detailDock?.type === "beat" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                    Top beat comercial
                  </p>
                  <h3 className="mt-2 truncate text-2xl font-black text-white">
                    {topBeatLabel(detailDock.beat)}
                  </h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {detailDock.beat.beat_slug ||
                      detailDock.beat.beat_id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDock}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:border-emerald-300 hover:text-emerald-200"
                  aria-label="Cerrar detalle de beat"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedBeatActivityTab("all")}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedBeatActivityTab === "all"
                      ? "border-emerald-300 bg-emerald-300/10"
                      : "border-emerald-300/20 bg-emerald-300/10 hover:border-emerald-300"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-emerald-200">
                    Descargas totales
                  </p>
                  <p className="mt-2 text-xl font-black text-emerald-100">
                    {detailDock.beat.total_downloads}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-400">
                    Ver todos
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBeatActivityTab("mp3")}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedBeatActivityTab === "mp3"
                      ? "border-cyan-300 bg-cyan-300/10"
                      : "border-cyan-300/20 bg-cyan-300/10 hover:border-cyan-300"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-cyan-200">
                    MP3
                  </p>
                  <p className="mt-2 text-xl font-black text-cyan-100">
                    {detailDock.beat.mp3}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-400">
                    Ver usuarios
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedBeatActivityTab("licenses")
                  }
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedBeatActivityTab === "licenses"
                      ? "border-cyan-300 bg-cyan-300/10"
                      : "border-white/10 bg-black/20 hover:border-cyan-300"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    Licencias
                  </p>
                  <p className="mt-2 text-xl font-black text-cyan-100">
                    {detailDock.beat.licenses}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-400">
                    Ver usuarios
                  </p>
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-bold uppercase text-zinc-400">
                  Resumen de actividad
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Este beat concentra {detailDock.beat.total_downloads}{" "}
                  actividad(es): {detailDock.beat.mp3} descarga(s) MP3 y{" "}
                  {detailDock.beat.licenses} licencia(s).
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">
                      ID
                    </p>
                    <p className="mt-1 break-all text-xs text-zinc-300">
                      {detailDock.beat.beat_id}
                    </p>
                  </div>

                  <div className="rounded-md border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">
                      Slug
                    </p>
                    <p className="mt-1 break-all text-xs text-zinc-300">
                      {detailDock.beat.beat_slug || "Sin slug"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-zinc-400">
                      Usuarios con actividad
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {selectedBeatActivityTab === "all"
                        ? "Todas las descargas/licencias"
                        : selectedBeatActivityTab === "mp3"
                          ? "Descargas MP3"
                          : "Licencias descargadas"}{" "}
                      · Puedes revocar acceso sin borrar el historial.
                    </p>
                  </div>

                  <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBeatActivityTab("all")
                      }
                      className={`h-8 rounded px-3 text-xs font-bold ${
                        selectedBeatActivityTab === "all"
                          ? "bg-cyan-300 text-black"
                          : "text-zinc-300 hover:text-cyan-200"
                      }`}
                    >
                      Todo
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBeatActivityTab("mp3")
                      }
                      className={`h-8 rounded px-3 text-xs font-bold ${
                        selectedBeatActivityTab === "mp3"
                          ? "bg-cyan-300 text-black"
                          : "text-zinc-300 hover:text-cyan-200"
                      }`}
                    >
                      MP3
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBeatActivityTab("licenses")
                      }
                      className={`h-8 rounded px-3 text-xs font-bold ${
                        selectedBeatActivityTab === "licenses"
                          ? "bg-cyan-300 text-black"
                          : "text-zinc-300 hover:text-cyan-200"
                      }`}
                    >
                      Licencias
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
                  {visibleBeatActivityUsers.length === 0 ? (
                    <p className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
                      Sin usuarios en esta sección.
                    </p>
                  ) : null}

                  {visibleBeatActivityUsers.map((user) => (
                    <article
                      key={`${selectedBeatActivityTab}-${detailDock.beat.beat_id}-${user.user_id}`}
                      className="rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {beatActivityUserLabel(user)}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {user.email}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            {user.count} evento(s) · Último:{" "}
                            {formatActivityDate(user.last_activity_at)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void revokeTopBeatUserAccess(
                              user,
                              detailDock.beat,
                            )
                          }
                          className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300/30 px-3 text-xs font-bold text-amber-100 hover:bg-amber-300/10"
                        >
                          Revocar acceso
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {detailDock.beat.beat_slug ? (
                  <Link
                    href={`/beats/${detailDock.beat.beat_slug}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300/30 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10"
                  >
                    <ExternalLink
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Abrir página pública
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsTopBeatsOpen(true)}
                  className="inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-xs font-bold text-zinc-200 hover:border-emerald-300 hover:text-emerald-100"
                >
                  Ver top beats
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {isEarningsHistoryOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#101317] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-cyan-200">
                  Finanzas B.R
                </p>
                <h3 className="mt-2 text-xl font-black">
                  Historial de ganancias
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Estados de cuenta mensuales basados en pagos manuales
                  registrados.
                </p>
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

            <div className="mt-5 max-h-105 space-y-3 overflow-y-auto pr-2">
              {earnings.history.length === 0 ? (
                <p className="rounded-md border border-white/10 p-4 text-sm text-zinc-400">
                  Sin pagos registrados.
                </p>
              ) : null}

              {earnings.history.map((item) => (
                <div
                  key={item.month}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-100">
                      {formatMonthLabel(item.month)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Total mensual: {money(item.amount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      downloadMonthlyStatement(item.month, item.amount)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/20 px-4 text-xs font-bold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-300/10"
                  >
                    <Download
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Descargar PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
