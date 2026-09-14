"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; exact?: boolean };

const items: NavItem[] = [
  { label: "Central", href: "/central", exact: true },
  { label: "Lab", href: "/central/lab" },
  { label: "Projects", href: "/central/projects" },
  { label: "Solutions", href: "/central/solutions" },
  { label: "Ecosystem", href: "/central/ecosystem" },
];

export function CentralNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="BR Central" className={`flex items-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${compact ? "w-full" : ""}`}>
    {items.map(({ label, href, exact }) => {
      const active = exact ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-black transition sm:px-4 ${active ? "bg-white/[0.09] text-white ring-1 ring-white/10" : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"}`}>{label}</Link>;
    })}
  </nav>;
}
