type AdminStatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function AdminStatCard({ label, value, detail }: AdminStatCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-cyan-200">{detail}</p>
    </article>
  );
}
