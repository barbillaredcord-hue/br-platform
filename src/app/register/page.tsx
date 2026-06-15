"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useUser } from "@/context/UserContext";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

export default function RegisterPage() {
  const { authEnabled, registerUser } = useUser();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
      <section className="mx-auto max-w-md rounded-lg border border-white/10 bg-[#101317] p-6">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="text-2xl font-black">Crear cuenta</h1>
            <p className="text-sm text-zinc-400">Registro visual B.R</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await registerUser({ name, username, email, password });
            setMessage(result.message ?? (result.ok ? "Cuenta creada." : "No se pudo crear la cuenta."));
          }}
        >
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Nombre</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <button type="submit" disabled={!authEnabled} className="h-11 w-full rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
            Crear cuenta
          </button>
        </form>

        {!authEnabled ? (
          <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-zinc-300">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
            <Link href="/admin/setup" className="inline-flex h-10 items-center justify-center rounded-md border border-cyan-300/30 text-sm font-bold text-cyan-200 hover:border-cyan-300 hover:bg-cyan-300/10">
              Configurar B.R
            </Link>
          </div>
        ) : null}
        {message ? <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</p> : null}

        <p className="mt-6 text-sm text-zinc-400">
          ¿Ya tienes usuario demo?{" "}
          <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
