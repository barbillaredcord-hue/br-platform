"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCw, UserRound } from "lucide-react";
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

const initialForm = {
  beat_id: "",
  amount: "",
  currency: "MXN",
  payment_method: "",
  note: "",
};

function userLabel(user: CommercialUser) {
  return user.display_name || user.username || user.email || user.id;
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function CommercialUsersPanel() {
  const [users, setUsers] = useState<CommercialUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<CommercialUser | null>(null);
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
    setBeatOptions([]);
    setForm(initialForm);
    void loadBeatOptions(user.id);
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

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadUsers]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Usuarios comerciales</p>
          <h2 className="mt-2 text-xl font-bold">Pagos por usuario</h2>
        </div>
        <button type="button" onClick={() => void loadUsers()} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
          <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {message ? <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-950/20 p-3 text-sm font-semibold text-cyan-100">{message}</p> : null}

      <div className="mt-5 grid gap-3">
        {users.length === 0 ? <p className="rounded-md border border-white/10 p-4 text-sm text-zinc-400">Sin usuarios comerciales todavía.</p> : null}

        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => selectUser(user)}
            className={`rounded-lg border p-4 text-left transition ${
              selectedUser?.id === user.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/[0.03] hover:border-cyan-300/40"
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <p className="truncate font-bold">{userLabel(user)}</p>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
                <span className="rounded-md bg-white/5 px-3 py-2 text-zinc-300">Acceso: {user.total_access_beats}</span>
                <span className="rounded-md bg-white/5 px-3 py-2 text-zinc-300">Pagados: {user.total_paid_beats}</span>
                <span className="rounded-md bg-white/5 px-3 py-2 text-cyan-100">Pendientes: {user.pending_payment_beats}</span>
                <span className="rounded-md bg-white/5 px-3 py-2 text-zinc-300">MP3: {user.mp3_download_count}</span>
                <span className="rounded-md bg-white/5 px-3 py-2 text-zinc-300">Licencias: {user.license_download_count}</span>
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-zinc-400">Total registrado: {money(user.total_paid_amount)}</p>
          </button>
        ))}
      </div>

      {selectedUser ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500">Registro manual</p>
              <h3 className="mt-1 font-bold">{userLabel(selectedUser)}</h3>
              <p className="text-xs text-zinc-500">{selectedUser.email}</p>
            </div>
            {isLoadingOptions ? <p className="text-sm text-zinc-400">Cargando beats...</p> : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-300">Beat pendiente de pago</span>
              <select value={form.beat_id} onChange={(event) => updateField("beat_id", event.target.value)} className="h-11 rounded-md border border-white/10 bg-[#15181c] px-3 text-sm outline-none focus:border-cyan-300">
                <option value="">{beatOptions.length === 0 ? "Sin beats pendientes" : "Selecciona un beat"}</option>
                {beatOptions.map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title || beat.slug || beat.id} {beat.genre ? `- ${beat.genre}` : ""} {beat.bpm ? `- ${beat.bpm} BPM` : ""}
                  </option>
                ))}
              </select>
              {selectedBeat ? <span className="text-xs text-zinc-500">ID: {selectedBeat.id}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-300">Monto</span>
              <input value={form.amount} onChange={(event) => updateField("amount", event.target.value)} type="number" min="0" step="0.01" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="1500.00" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-300">Moneda</span>
              <input value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="MXN" maxLength={3} />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-300">Método</span>
              <input value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Transferencia, efectivo..." />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-zinc-300">Nota</span>
              <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} className="min-h-24 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Referencia o nota interna" />
            </label>
          </div>

          <div className="mt-5">
            <button type="button" onClick={() => void submitPayment()} disabled={isSaving || !form.beat_id || beatOptions.length === 0} className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {isSaving ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
