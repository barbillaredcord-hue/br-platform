import Link from "next/link";
import { BR_ROUTES } from "@/lib/routes";
import { LogoMark } from "./LogoMark";

const sidebarItems = [
  { label: "Inicio", href: BR_ROUTES.musicHome },
  { label: "Explorar", href: "/explore" },
  { label: "Favoritos", href: "/account/saved" },
  { label: "Mis Beats", href: "/account/beats" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#090b0d] px-5 py-6 lg:block">
      <Link
        href={BR_ROUTES.musicHome}
        aria-label="Ir al inicio de Beat Room"
        className="mb-10 flex items-center gap-3 rounded-md transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <LogoMark decorative />
        <div>
          <p className="text-sm font-semibold text-white">Beat Room</p>
          <p className="text-xs text-zinc-500">Acceso privado</p>
        </div>
      </Link>

      <nav className="space-y-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-md px-3 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-cyan-200"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
