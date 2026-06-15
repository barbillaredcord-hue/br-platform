import Link from "next/link";
import { ArrowLeft, Inbox, LayoutDashboard, ListMusic, Plus, SlidersHorizontal } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { allBeats } from "@/data/beats";

const navItems = [
  { href: "/", label: "Home", icon: ArrowLeft },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/admin/beats", label: "Beats", icon: ListMusic },
  { href: "/admin/beats/new", label: "Subir Beat", icon: Plus },
  { href: "/admin/access-requests", label: "Solicitudes", icon: Inbox },
  { href: `/admin/beats/${allBeats[0]?.id ?? "aqua-nights"}/preview-editor`, label: "Preview Editor", icon: SlidersHorizontal },
];

export function AdminShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050607] px-4 py-6 pb-32 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-white/10 bg-[#090b0d] p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <div className="mb-6 flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm font-bold">B.R Admin</p>
              <p className="text-xs text-zinc-500">Gestión demo</p>
            </div>
          </div>
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-cyan-200"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="rounded-lg border border-white/10 bg-[#101317] p-5 md:p-6">
            <p className="mb-2 text-sm font-bold uppercase text-cyan-200">Panel privado</p>
            <h1 className="text-3xl font-black md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{subtitle}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
