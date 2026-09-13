import type { ReactNode } from "react";
import { CentralNav } from "@/components/central/CentralNav";

export default function CentralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#09090b]">
      <div className="sticky top-0 z-[60] border-b border-white/[0.06] bg-[#09090b]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-8">
          <span className="hidden text-[9px] font-black uppercase tracking-[0.28em] text-zinc-700 sm:block">BR Central //</span>
          <CentralNav compact />
        </div>
      </div>
      {children}
    </div>
  );
}
