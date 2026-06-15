"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Save, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useUser } from "@/context/UserContext";

const storageKey = "br-setup-config";

type SetupConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  brceoEmail: string;
};

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

export default function AdminSetupPage() {
  const { authEnabled, isAdmin, isLoadingSession } = useUser();
  const [config, setConfig] = useState<SetupConfig>(getInitialConfig);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [message, setMessage] = useState("");

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
