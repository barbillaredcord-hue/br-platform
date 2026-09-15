"use client";

import Image from "next/image";
import { ArrowUpRight, Boxes, FlaskConical, Layers3, Network } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CentralEntryLink() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!entering) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => router.push("/central"), reduceMotion ? 120 : 1050);
    return () => window.clearTimeout(timer);
  }, [entering, router]);

  return (
    <>
      <button type="button" onClick={() => setEntering(true)} className="group relative min-h-[390px] w-full overflow-hidden rounded-[32px] border border-amber-200/15 bg-[linear-gradient(145deg,rgba(29,22,10,.95),rgba(12,12,13,.98)_48%,rgba(25,19,10,.96))] p-7 text-left transition hover:-translate-y-1 hover:border-amber-200/35 sm:p-9">
        <div className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-8 top-8 h-40 w-40 rounded-full border border-amber-200/[0.07]" />
        <div className="absolute right-14 top-14 h-28 w-28 rounded-full border border-amber-200/[0.06]" />
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-4"><Image src="/brand/br-central-logo.svg" alt="BR Central" width={68} height={68} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-amber-100/15" /><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200">BR Central</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">System hub</p></div></div>
            <h2 className="mt-8 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Donde las ideas se conectan.</h2>
            <p className="mt-5 max-w-xl leading-7 text-zinc-400">Proyectos, experimentos, soluciones y las relaciones que explican por qué cada sistema existe y cómo evoluciona.</p>
            <div className="mt-6 flex gap-2 text-amber-200/40"><Layers3 className="h-4 w-4"/><FlaskConical className="h-4 w-4"/><Boxes className="h-4 w-4"/><Network className="h-4 w-4"/></div>
          </div>
          <span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-amber-100">Entrar a Central <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        </div>
      </button>

      {entering && <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#070706]" role="status" aria-live="polite"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,178,84,0.16),transparent_30%)] animate-pulse" /><div className="absolute h-[52vw] max-h-[620px] w-[52vw] max-w-[620px] rounded-full border border-amber-200/[0.08]" /><div className="absolute h-[34vw] max-h-[400px] w-[34vw] max-w-[400px] rounded-full border border-amber-200/[0.10]" /><div className="relative px-6 text-center"><Image src="/brand/br-central-logo.svg" alt="BR Central" width={96} height={96} className="mx-auto h-24 w-24 rounded-[24px] object-cover shadow-[0_0_80px_rgba(226,178,84,.18)]" /><p className="mt-7 text-[10px] font-black uppercase tracking-[0.5em] text-amber-200">Entrando a</p><p className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-6xl">CENTRAL</p><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-500">Ideas, experimentos y sistemas comparten contexto aquí.</p></div></div>}
    </>
  );
}
