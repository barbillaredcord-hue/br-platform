import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CentralNav } from "@/components/central/CentralNav";
import { PrivateAppsMenu } from "@/components/central/PrivateAppsMenu";
import { BR_ROUTES } from "@/lib/routes";

export default function CentralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#09090b]">
      <header className="sticky top-0 z-[60] border-b border-amber-200/[0.07] bg-[#09090b]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-8">
          <Link href={BR_ROUTES.entrySelector} className="flex shrink-0 items-center gap-3" aria-label="Volver a la entrada de BR Central">
            <Image
              src="/brand/br-central-logo.svg"
              alt="BR Central"
              width={44}
              height={44}
              priority
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-amber-100/15 sm:h-11 sm:w-11"
            />
            <span className="hidden sm:block">
              <strong className="block text-xs tracking-[0.18em] text-white">BR CENTRAL</strong>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-amber-200/45">Ideas · proyectos · soluciones</span>
            </span>
          </Link>
          <div className="min-w-0 flex-1 overflow-hidden"><CentralNav compact /></div>
          <div className="shrink-0"><PrivateAppsMenu /></div>
        </div>
      </header>
      {children}
    </div>
  );
}
