import { LogoMark } from "./LogoMark";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050607]/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark compact />
            <span className="font-semibold">Beat Room</span>
          </div>
          <div className="hidden text-2xl font-black lg:block">B.R</div>
          <button className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200 md:hidden">
            Acceder
          </button>
        </div>

        <div className="flex flex-1 items-center gap-3 md:max-w-2xl">
          <label className="sr-only" htmlFor="search">
            Buscar beats
          </label>
          <input
            id="search"
            type="search"
            placeholder="Buscar beats, género o BPM"
            className="h-11 w-full rounded-md border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-300"
          />
          <button className="hidden rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-200 md:block">
            Acceder
          </button>
        </div>
      </div>
    </header>
  );
}
