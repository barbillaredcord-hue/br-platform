import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type AdminQuickLinkProps = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

export function AdminQuickLink({ href, label, detail, icon: Icon }: AdminQuickLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-cyan-300/20 bg-[#101317] p-3 transition hover:border-cyan-300 hover:bg-[#15181c]"
    >
      <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{detail}</p>
    </Link>
  );
}
