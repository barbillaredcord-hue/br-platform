import Link from "next/link";
import { ArrowRight, Boxes, KeyRound, Network, RadioTower, Sparkles } from "lucide-react";
import { ecosystemConnections, ecosystemSharedPrinciples } from "@/lib/central/ecosystem";

const icons = { radio: RadioTower, key: KeyRound, sparkles: Sparkles, boxes: Boxes };

export function EcosystemConnections() {
  return <>
    <div className="grid gap-4 md:grid-cols-2">{ecosystemConnections.map((item) => { const Icon = icons[item.icon]; return <Link key={`${item.from}-${item.to}`} href={item.href} className="group rounded-[30px] border border-white/[0.075] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-cyan-300/20 sm:p-8"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] text-cyan-200"><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-cyan-300" /></div><div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.24em] text-zinc-600">{item.fromType}</p><p className="mt-2 font-black text-zinc-200">{item.from}</p></div><ArrowRight className="h-4 w-4 text-zinc-700" /><div><p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-400">{item.toType}</p><p className="mt-2 font-black text-white">{item.to}</p></div></div><p className="mt-6 text-sm leading-7 text-zinc-500">{item.why}</p></Link>; })}</div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ecosystemSharedPrinciples.map((item) => <article key={item.title} className="rounded-[25px] border border-white/[0.07] bg-black/15 p-6"><Network className="h-5 w-5 text-violet-300" /><h2 className="mt-6 text-xl font-black tracking-[-0.03em]">{item.title}</h2><p className="mt-3 text-sm leading-6 text-zinc-500">{item.text}</p></article>)}</div>
  </>;
}
