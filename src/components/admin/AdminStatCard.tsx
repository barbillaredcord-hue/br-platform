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
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-cyan-200">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-lg border border-white/10 bg-[#101317] p-5 transition hover:border-cyan-300 hover:bg-[#15181c]">
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-lg border border-white/10 bg-[#101317] p-5">
      {content}
    </article>
  );
}
