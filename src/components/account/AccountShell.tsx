"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useUser } from "@/context/UserContext";

const navItems = [
  { href: "/account", label: "Resumen" },
  { href: "/account/beats", label: "Mis beats" },
  { href: "/account/requests", label: "Solicitudes" },
  { href: "/account/saved", label: "Guardados" },
  { href: "/account/settings", label: "Ajustes" },
];

export function AccountShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoadingSession } = useUser();

  if (isLoadingSession) {
    return <main className="min-h-screen bg-[#050607] p-6 text-white">Cargando cuenta...</main>;
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#050607] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-lg border border-cyan-300/20 bg-[#101317] p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-cyan-200" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black">Inicia sesión</h1>
          <p className="mt-2 text-sm text-zinc-400">Necesitas una sesión B.R para abrir tu cuenta.</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
            Ir a login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-6 pb-32 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-white/10 bg-[#090b0d] p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <p className="text-sm font-bold text-cyan-200">@{currentUser.username}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{currentUser.email}</p>
          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded-md px-3 py-3 text-sm font-semibold transition ${pathname === item.href ? "bg-cyan-300 text-black" : "text-zinc-300 hover:bg-white/10 hover:text-cyan-200"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="rounded-lg border border-white/10 bg-[#101317] p-5 md:p-6">
            <p className="mb-2 text-sm font-bold uppercase text-cyan-200">Mi cuenta B.R</p>
            <h1 className="text-3xl font-black md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{subtitle}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
