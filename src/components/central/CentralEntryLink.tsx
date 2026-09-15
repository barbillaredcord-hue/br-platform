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
      <button type="button" onClick={() => setEntering(true)} className="group relative min-h-[330px] w-full overflow-hidden rounded-[28px] border border-amber-200/15 bg-[linear-gradient(145deg,rgba(29,22,10,.95),rgba(12,12,13,.98)_48%,rgba(25,19,10,.96))] p-5 text-left transition hover:-translate-y-1 hover:border-amber-200/35 sm:min-h-[390px] sm:rounded-[32px] sm:p-9">
        <div className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-5 top-5 h-32 w-32 rounded-full border border-amber-200/[0.07] sm:right-8 sm:top-8 sm:h-40 sm:w-40" />
        <div className="absolute right-10 top-10 h-20 w-20 rounded-full border border-amber-200/[0.06] sm:right-14 sm:top-14 sm:h-28 sm:w-28" />
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 sm:gap-4"><Image src="/brand/br-central-logo.svg" alt="BR Central" width={68} height={68} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-100/15 sm:h-16 sm:w-16" /><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200 sm:tracking-[0.3em]">BR Central</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 sm:text-xs sm:tracking-[0.16em]">System hub</p></div></div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.05em] sm:mt-8 sm:text-5xl">Donde las ideas se conectan.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">Proyectos, experimentos, soluciones y las relaciones que explican por qué cada sistema existe y cómo evoluciona.</p>
            <div className="mt-5 flex gap-2 text-amber-200/40 sm:mt-6"><Layers3 className="h-4 w-4"/><FlaskConical className="h-4 w-4"/><Boxes className="h-4 w-4"/><Network className="h-4 w-4"/></div>
          </div>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-amber-100 sm:mt-10">Entrar a Central <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        </div>
      </button>

      {entering && <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#070706]" role="status" aria-live="polite"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,178,84,0.16),transparent_30%)] animate-pulse" /><div className="absolute h-[76vw] max-h-[620px] w-[76vw] max-w-[620px] rounded-full border border-amber-200/[0.08] sm:h-[52vw] sm:w-[52vw]" /><div className="absolute h-[52vw] max-h-[400px] w-[52vw] max-w-[400px] rounded-full border border-amber-200/[0.10] sm:h-[34vw] sm:w-[34vw]" /><div className="relative px-6 text-center"><Image src="/brand/br-central-logo.svg" alt="BR Central" width={96} height={96} className="mx-auto h-20 w-20 rounded-[22px] object-cover shadow-[0_0_80px_rgba(226,178,84,.18)] sm:h-24 sm:w-24 sm:rounded-[24px]" /><p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-amber-200 sm:mt-7">Entrando a</p><p className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-6xl">CENTRAL</p><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-500">Ideas, experimentos y sistemas comparten contexto aquí.</p></div></div>}
    </>
  );
}
