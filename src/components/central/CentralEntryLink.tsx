"use client";

import { ArrowUpRight } from "lucide-react";
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
      <button
        type="button"
        onClick={() => setEntering(true)}
        className="group relative min-h-[360px] w-full overflow-hidden rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-violet-500/[0.10] p-7 text-left transition hover:-translate-y-1 hover:border-violet-200/30 sm:p-9"
      >
        <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-violet-500/12 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider text-violet-100">BR</div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">BR Central</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Entra donde las ideas se conectan.</h2>
            <p className="mt-5 max-w-xl leading-7 text-zinc-400">Proyectos, experimentos, soluciones y el contexto detrás de por qué decidimos construirlos.</p>
          </div>
          <span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-violet-100">Entrar a Central <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        </div>
      </button>

      {entering && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#07080b]" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,105,255,0.20),transparent_28%),radial-gradient(circle_at_50%_70%,rgba(157,78,255,0.12),transparent_35%)] animate-pulse" />
          <div className="absolute h-[52vw] max-h-[620px] w-[52vw] max-w-[620px] rounded-full border border-blue-200/[0.08]" />
          <div className="absolute h-[34vw] max-h-[400px] w-[34vw] max-w-[400px] rounded-full border border-violet-200/[0.10]" />
          <div className="relative px-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-white/15 bg-white/[0.04] text-lg font-black tracking-widest text-white shadow-[0_0_80px_rgba(99,102,241,.25)]">BR</div>
            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.5em] text-blue-200">Entrando a</p>
            <p className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-6xl">CENTRAL</p>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-500">Ideas, experimentos y sistemas comparten contexto aquí.</p>
          </div>
        </div>
      )}
    </>
  );
}
