import type { ReactNode } from "react";
import Link from "next/link";
import { CentralNav } from "@/components/central/CentralNav";
import { PrivateAppsMenu } from "@/components/central/PrivateAppsMenu";
import { BR_ROUTES } from "@/lib/routes";

export default function CentralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#09090b]">
      <header className="sticky top-0 z-[60] border-b border-white/[0.06] bg-[#09090b]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
          <Link href={BR_ROUTES.entrySelector} className="flex shrink-0 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-xs font-black tracking-wider text-white">BR</span>
            <span className="hidden sm:block">
              <strong className="block text-xs tracking-[0.18em] text-white">BR STUDIOS</strong>
              <span className="block text-[9px] uppercase tracking-[0.32em] text-zinc-600">Central</span>
            </span>
          </Link>
          <div className="min-w-0 flex-1"><CentralNav compact /></div>
          <PrivateAppsMenu />
        </div>
      </header>
      {children}
    </div>
  );
}
