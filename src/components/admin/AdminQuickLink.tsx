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
    <Link href={href} className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5 transition hover:border-cyan-300 hover:bg-[#15181c]">
      <Icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
      <p className="mt-4 font-bold">{label}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p>
    </Link>
  );
}
