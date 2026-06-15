"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";

export function AuthControls() {
  const { authEnabled, currentUser, isAdmin, logout } = useUser();

  if (!currentUser) {
    return (
      <div className="flex flex-wrap gap-2">
        {!authEnabled ? (
          <Link href="/admin/setup" className="inline-flex h-11 items-center rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
            Setup
          </Link>
        ) : null}
        <Link href="/login" className="inline-flex h-11 items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black transition hover:bg-cyan-200">
          Login
        </Link>
        <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-cyan-200">
        @{currentUser.username}
      </span>
      <Link href="/account" className="inline-flex h-10 items-center rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
        Mi cuenta
      </Link>
      {isAdmin ? (
        <>
          <Link href="/admin" className="inline-flex h-10 items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black transition hover:bg-cyan-200">
            Admin
          </Link>
          <Link href="/admin/setup" className="inline-flex h-10 items-center rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
            Setup
          </Link>
        </>
      ) : null}
      <button type="button" onClick={() => void logout()} className="h-10 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
        Cerrar sesión
      </button>
    </div>
  );
}
