"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useUser } from "@/context/UserContext";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

const quickUsers = [
  { label: "Entrar como B.RCEO", email: "admin@br.local" },
  { label: "Entrar como Cliente Uno", email: "clienteuno@example.com" },
  { label: "Entrar como Cliente Dos", email: "clientedos@example.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const { authEnabled, loginAsUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const login = async (nextEmail: string) => {
    const result = await loginAsUser(nextEmail, password);

    if (!result.ok) {
      setMessage(result.message ?? "No se pudo iniciar sesión.");
      return;
    }

    router.push(nextEmail.trim().toLowerCase() === (process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "admin@br.local").toLowerCase() ? "/admin" : "/");
  };

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
      <section className="mx-auto max-w-md rounded-lg border border-white/10 bg-[#101317] p-6">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="text-2xl font-black">Entrar a B.R</h1>
            <p className="text-sm text-zinc-400">Acceso privado demo</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            login(email);
          }}
        >
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <button type="submit" disabled={!authEnabled} className="h-11 w-full rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
            Entrar
          </button>
        </form>

        {!authEnabled ? (
          <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-zinc-300">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
          </div>
        ) : null}
        {message ? <p className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">{message}</p> : null}

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-sm font-bold text-cyan-200">Usuarios de prueba</p>
          <div className="grid gap-2">
            {quickUsers.map((user) => (
              <button key={user.email} type="button" onClick={() => setEmail(user.email)} className="h-10 rounded-md border border-white/10 text-sm font-semibold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
                {user.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}
