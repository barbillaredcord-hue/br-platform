"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";

export default function RegisterPage() {
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
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("Cuenta preparada. En la siguiente fase se conectará el registro real.");
          }}
        >
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Nombre</span>
            <input className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Username</span>
            <input className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Email</span>
            <input type="email" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Password</span>
            <input type="password" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <button type="submit" className="h-11 w-full rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200">
            Crear cuenta
          </button>
        </form>

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
