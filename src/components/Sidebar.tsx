import { LogoMark } from "./LogoMark";

const sidebarItems = ["Inicio", "Explorar", "Favoritos", "Mis Beats"];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#090b0d] px-5 py-6 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="text-sm font-semibold text-white">Beat Room</p>
          <p className="text-xs text-zinc-500">Acceso privado</p>
        </div>
      </div>

      <nav className="space-y-2">
        {sidebarItems.map((item) => (
          <a
            key={item}
            href="#"
            className="block rounded-md px-3 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-cyan-200"
          >
            {item}
          </a>
        ))}
      </nav>
    </aside>
  );
}
