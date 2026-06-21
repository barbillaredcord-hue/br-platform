import Link from "next/link";

type AdminStatCardProps = {
  label: string;
  value: string;
  detail: string;
  href?: string;
};

export function AdminStatCard({ label, value, detail, href }: AdminStatCardProps) {
  const content = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-cyan-200/80">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-lg border border-white/10 bg-[#101317] p-3 transition hover:border-cyan-300 hover:bg-[#15181c]">
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-lg border border-white/10 bg-[#101317] p-3">
      {content}
    </article>
  );
}
