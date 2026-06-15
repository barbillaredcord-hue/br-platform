"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useUser } from "@/context/UserContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-lg border border-cyan-300/20 bg-[#101317] p-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black">Acceso restringido</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Solo B.RCEO puede administrar B.R.</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
            Ir a login
          </Link>
        </section>
      </main>
    );
  }

  return children;
}
