import type { Beat } from "@/data/beats";
import { PlayButton } from "./PlayButton";

type PlayerBarProps = {
  beat: Beat;
};

export function PlayerBar({ beat }: PlayerBarProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#090b0d] px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{beat.name}</p>
          <p className="text-sm text-zinc-400">Preview 15s</p>
        </div>
        <PlayButton variant="circle" ariaLabel="Reproducir" />
        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <span className="text-xs text-zinc-500">0:00</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 rounded-full bg-cyan-300" />
          </div>
          <span className="text-xs text-zinc-500">0:15</span>
        </div>
      </div>
    </footer>
  );
}
