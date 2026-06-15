"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck, Eye, EyeOff, Lock, PlugZap, Save, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useUser } from "@/context/UserContext";
import { getSupabasePublicConfigStatus, SUPABASE_CONNECTION_STATUS_EVENT, SUPABASE_CONNECTION_STATUS_KEY, type SupabaseConnectionStatus } from "@/lib/supabase/config";

const storageKey = "br-setup-config";

type SetupConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  brceoEmail: string;
};

type ConnectionStatus = SupabaseConnectionStatus | "checking";

const emptyConfig: SetupConfig = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  brceoEmail: "",
};

function getInitialConfig() {
  if (typeof window === "undefined") {
    return emptyConfig;
  }

  const rawConfig = window.localStorage.getItem(storageKey);

  if (!rawConfig) {
    return emptyConfig;
  }

  try {
    return { ...emptyConfig, ...JSON.parse(rawConfig) } as SetupConfig;
  } catch {
    return emptyConfig;
  }
}

const steps = [
  "Paso 1: Crear proyecto Supabase",
  "Paso 2: Project Settings > API",
  "Paso 3: Copiar URL y anon key",
  "Paso 4: Pegar aquí",
  "Paso 5: Copiar también a .env.local",
  "Paso 6: Copiar también a Vercel env vars",
];

const failureCauses = ["URL incorrecta", "Anon Key incorrecta", "Proyecto Supabase detenido", "Variables no cargadas", "Reiniciar npm run dev"];

function StatusRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm">
      <span className="font-semibold text-zinc-300">{label}</span>
      <span className={ready ? "font-bold text-emerald-200" : "font-bold text-amber-200"}>{ready ? "Sí" : "No"}</span>
    </div>
  );
}

function getConnectionStatusLabel(status: ConnectionStatus) {
  if (status === "connected") {
    return "conectado";
  }

  if (status === "checking") {
    return "pendiente";
  }

  return status;
}

function saveConnectionStatus(status: SupabaseConnectionStatus) {
  window.localStorage.setItem(SUPABASE_CONNECTION_STATUS_KEY, status);
  window.dispatchEvent(new Event(SUPABASE_CONNECTION_STATUS_EVENT));
}

export default function AdminSetupPage() {
  const { authEnabled, isAdmin, isLoadingSession } = useUser();
  const [config, setConfig] = useState<SetupConfig>(getInitialConfig);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [message, setMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("pending");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [lastVerification, setLastVerification] = useState("");
  const publicConfigStatus = getSupabasePublicConfigStatus();
  const supabaseUrl = publicConfigStatus.supabaseUrl;
  const supabaseAnonKey = publicConfigStatus.supabaseAnonKey;

  const verifySupabaseConnection = useCallback(async () => {
    const verifiedAt = new Date().toLocaleTimeString("es-MX", { hour12: false });
    setLastVerification(verifiedAt);

    if (!supabaseUrl || !supabaseAnonKey) {
      setConnectionStatus("error");
      setConnectionMessage("Faltan variables públicas de Supabase cargadas por Next.");
      saveConnectionStatus("error");
      return;
    }

    setConnectionStatus("checking");
    setConnectionMessage("");

    try {
      const authSettingsUrl = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/settings`;
      const response = await fetch(authSettingsUrl, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Auth respondió ${response.status}`);
      }

      setConnectionStatus("connected");
      setConnectionMessage("Conexión exitosa");
      saveConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage(error instanceof Error ? error.message : "Error de conexión");
      saveConnectionStatus("error");
    }
  }, [supabaseAnonKey, supabaseUrl]);

  useEffect(() => {
    const initialCheckId = window.setTimeout(() => {
      void verifySupabaseConnection();
    }, 0);
    const intervalId = window.setInterval(() => {
      void verifySupabaseConnection();
    }, 10000);

    return () => {
      window.clearTimeout(initialCheckId);
      window.clearInterval(intervalId);
    };
  }, [verifySupabaseConnection]);

  if (isLoadingSession) {
    return (
      <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-lg border border-white/10 bg-[#101317] p-6 text-center">
          <p className="text-sm font-semibold text-cyan-200">Validando sesión...</p>
        </section>
      </main>
    );
  }

  if (authEnabled && !isAdmin) {
    return (
      <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-lg border border-cyan-300/20 bg-[#101317] p-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black">Acceso restringido</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Solo B.RCEO puede administrar esta configuración cuando Supabase ya está activo.</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
            Ir a login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-8 pb-32 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-lg border border-white/10 bg-[#101317] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-sm font-bold uppercase text-cyan-200">Setup B.R</p>
                <h1 className="text-3xl font-black md:text-5xl">Configuración Supabase</h1>
              </div>
            </div>
            <Link href="/" className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              Volver a Home
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
            Captura aquí los datos públicos necesarios para preparar B.R. Esta pantalla guarda una referencia local; no cambia variables de Next en runtime.
          </p>
        </header>

        <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-cyan-200">Estado de Supabase</p>
              <h2 className="mt-1 text-2xl font-black">Verificación visual</h2>
            </div>
            <button
              type="button"
              onClick={verifySupabaseConnection}
              disabled={connectionStatus === "checking"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlugZap className="h-4 w-4" aria-hidden="true" />
              {connectionStatus === "checking" ? "Verificando..." : "Verificar conexión"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm">
              <span className="text-zinc-400">Estado de conexión: </span>
              <span className={connectionStatus === "connected" ? "font-bold text-emerald-200" : connectionStatus === "error" ? "font-bold text-red-200" : "font-bold text-amber-200"}>
                {getConnectionStatusLabel(connectionStatus)}
              </span>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm">
              <span className="text-zinc-400">Última verificación: </span>
              <span className="font-bold text-zinc-200">{lastVerification || "pendiente"}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatusRow label="URL configurada" ready={publicConfigStatus.hasSupabaseUrl} />
            <StatusRow label="Anon Key configurada" ready={publicConfigStatus.hasSupabaseAnonKey} />
            <StatusRow label="Email B.RCEO configurado" ready={publicConfigStatus.hasBrceoEmail} />
          </div>

          {connectionStatus === "connected" ? (
            <div className="mt-5 flex gap-3 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="font-bold">Conexión exitosa</p>
            </div>
          ) : null}

          {connectionStatus === "error" ? (
            <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="flex gap-3 text-sm text-amber-100">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">Error de conexión</p>
                  {connectionMessage ? <p className="mt-1 text-zinc-300">{connectionMessage}</p> : null}
                </div>
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
                {failureCauses.map((cause) => (
                  <li key={cause} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                    {cause}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                window.localStorage.setItem(storageKey, JSON.stringify(config));
                setMessage("Configuración guardada localmente para referencia. Para activar Supabase en desarrollo o producción debes copiar estos valores a .env.local y a Vercel Environment Variables.");
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-300">NEXT_PUBLIC_SUPABASE_URL</span>
                <input
                  value={config.supabaseUrl}
                  onChange={(event) => setConfig((current) => ({ ...current, supabaseUrl: event.target.value }))}
                  placeholder="https://tu-proyecto.supabase.co"
                  className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <div className="flex gap-2">
                  <input
                    value={config.supabaseAnonKey}
                    onChange={(event) => setConfig((current) => ({ ...current, supabaseAnonKey: event.target.value }))}
                    type={showAnonKey ? "text" : "password"}
                    placeholder="anon public key"
                    className="h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                  />
                  <button type="button" onClick={() => setShowAnonKey((current) => !current)} className="grid h-11 w-11 place-items-center rounded-md border border-white/10 text-zinc-200 hover:border-cyan-300 hover:text-cyan-200" aria-label={showAnonKey ? "Ocultar anon key" : "Mostrar anon key"}>
                    {showAnonKey ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-300">NEXT_PUBLIC_BRCEO_EMAIL</span>
                <input
                  value={config.brceoEmail}
                  onChange={(event) => setConfig((current) => ({ ...current, brceoEmail: event.target.value }))}
                  placeholder="admin@br.local"
                  type="email"
                  className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
                />
              </label>

              <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-cyan-100">Nunca pegues service_role key aquí.</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">Solo usa la anon public key. La service_role key no debe vivir en el navegador.</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
                <Save className="h-4 w-4" aria-hidden="true" />
                Guardar configuración
              </button>
            </form>

            {message ? <p className="mt-5 rounded-md border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-300">{message}</p> : null}
          </section>

          <aside className="rounded-lg border border-white/10 bg-[#101317] p-5">
            <h2 className="text-xl font-black">Instrucciones</h2>
            <ol className="mt-4 grid gap-3">
              {steps.map((step) => (
                <li key={step} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-zinc-200">
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-cyan-200">Variables a copiar manualmente</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-zinc-300">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BRCEO_EMAIL=`}
              </pre>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
