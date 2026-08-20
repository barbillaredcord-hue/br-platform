"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Inbox, KeyRound, LayoutDashboard, ListMusic, Plus, Settings, SlidersHorizontal, Users } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { allBeats } from "@/data/beats";
import { notifyDomainChange } from "@/lib/domain-events";
import { BR_ROUTES } from "@/lib/routes";
import { AdminGuard } from "./AdminGuard";

const homeItem = { href: BR_ROUTES.musicHome, label: "Home musical", icon: ArrowLeft };

const navItems = [
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/admin/setup", label: "Estado Supabase", icon: Settings },
  { href: "/admin/beats", label: "Beats", icon: ListMusic },
  { href: "/admin/beats/new", label: "Subir Beat", icon: Plus },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/access", label: "Accesos", icon: KeyRound },
  { href: "/admin/access-requests", label: "Solicitudes", icon: Inbox },
  { href: "/admin/br-cambios", label: "B.R Cambios", icon: History },
  { href: `/admin/beats/${allBeats[0]?.id ?? "aqua-nights"}/preview-editor`, label: "Preview Editor", icon: SlidersHorizontal },
];

export function AdminShell({ title, subtitle, children, compact = false }: { title: string; subtitle: string; children: React.ReactNode; compact?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const HomeIcon = homeItem.icon;

  useEffect(() => {
    const reconcile = () => notifyDomainChange("all");
    const reconcileWhenVisible = () => {
      if (document.visibilityState === "visible") {
        reconcile();
      }
    };

    window.addEventListener("focus", reconcile);
    window.addEventListener("online", reconcile);
    document.addEventListener("visibilitychange", reconcileWhenVisible);

    return () => {
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("online", reconcile);
      document.removeEventListener("visibilitychange", reconcileWhenVisible);
    };
  }, []);

  return (
    <AdminGuard>
      <main className={`min-h-screen bg-[#050607] px-3 pb-32 text-white md:px-6 ${compact ? "py-2.5" : "py-6"}`}>
        <div className={`mx-auto grid gap-4 lg:grid-cols-[220px_1fr] ${compact ? "max-w-[1680px]" : "max-w-7xl lg:grid-cols-[240px_1fr]"}`}>
          <aside className="rounded-lg border border-white/10 bg-[#090b0d] p-3 lg:sticky lg:top-4 lg:h-fit">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              <LogoMark decorative />
              <div className="min-w-0">
                <p className="text-sm font-bold">B.R Admin</p>
                <p className="text-xs text-zinc-500">{isMenuOpen ? "Ocultar menú" : "Abrir menú"}</p>
              </div>
            </button>

            <Link
              href={homeItem.href}
              className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-cyan-200"
            >
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              {homeItem.label}
            </Link>
            <Link
              href={BR_ROUTES.centralHome}
              className="mt-1 flex items-center rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-cyan-200"
            >
              Ir a BR STUDIOS Central
            </Link>

            {isMenuOpen ? (
              <nav className="mt-2 grid gap-1.5 border-t border-white/10 pt-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-cyan-200"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </aside>

          <section className={`min-w-0 ${compact ? "space-y-3" : "space-y-6"}`}>
            <header className={`rounded-lg border border-white/10 bg-[#101317] ${compact ? "p-2.5 md:p-3" : "p-5 md:p-6"}`}>
              <p className={`${compact ? "mb-0.5 text-[10px]" : "mb-1 text-xs"} font-bold uppercase text-cyan-200`}>Panel privado</p>
              <h1 className={`font-black ${compact ? "text-xl md:text-2xl" : "text-3xl md:text-5xl"}`}>{title}</h1>
              <p className={`max-w-2xl text-zinc-400 ${compact ? "mt-0.5 text-xs leading-5" : "mt-3 text-sm leading-6"}`}>{subtitle}</p>
            </header>
            {children}
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
