import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FlaskConical, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import { BRCompanion } from "@/components/central/BRCompanion";

export const metadata: Metadata = {
  title: "BR Lab | BR STUDIOS Central",
  description: "Experimentos, hipótesis y aprendizajes técnicos de BR STUDIOS antes de convertirse en proyectos.",
};

const experiments = [
  {
    name: "Radar de red contextual",
    status: "Probando",
    question: "¿Una red puede explicarse por identidad y cambios, no solo por direcciones IP?",
    test: "Combinar presencia, MAC, historial, servicios y señales de dispositivos para construir contexto.",
    learning: "La IP cambia; la identidad y el historial son más útiles para entender qué ocurrió.",
    next: "Convertir señales confiables en una capa reutilizable para WiFi Monitor.",
    icon: RadioTower,
  },
  {
    name: "Acceso privado por dispositivo",
    status: "Validando",
    question: "¿Podemos hacer que una herramienta sensible se sienta simple sin volverla pública?",
    test: "Combinar sesión de administrador, autenticación del dispositivo y redes privadas para acciones sensibles.",
    learning: "Biometría en la interfaz no sustituye autorización del servidor; ambas capas tienen trabajos distintos.",
    next: "Definir un patrón común de autorización para herramientas privadas de BR.",
    icon: ShieldCheck,
  },
  {
    name: "Companion contextual",
    status: "En evolución",
    question: "¿Una interfaz puede orientar sin convertirse en otro chatbot genérico?",
    test: "Usar ubicación, intención elegida y contexto del proyecto para cambiar la guía que aparece.",
    learning: "La utilidad aparece cuando Companion entiende dónde estás y por qué llegaste, no cuando intenta responder de todo.",
    next: "Conectar contexto de Lab, Projects, Solutions y Ecosystem sin perder el camino elegido.",
    icon: Sparkles,
  },
];

export default function LabPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[780px] bg-[radial-gradient(circle_at_16%_10%,rgba(57,189,248,0.12),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,0.13),transparent_30%)]" />
      <header className="relative z-10 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/central" className="inline-flex items-center gap-2 text-sm font-black text-zinc-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> BR Central</Link>
          <span className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">BR Lab</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.72fr] lg:items-start">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Antes de que algo sea proyecto //</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl">Aquí todavía está permitido <span className="text-zinc-500">no saber.</span></h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">BR Lab conserva preguntas, hipótesis, pruebas y resultados. Un experimento no necesita convertirse en producto para haber valido la pena: también puede enseñarnos qué no construir.</p>
          </div>
          <BRCompanion />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="mb-6 border-t border-white/[0.07] pt-7"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Experimentos activos //</p><p className="mt-2 text-sm text-zinc-500">Pregunta → prueba → aprendizaje → siguiente decisión.</p></div>
        <div className="grid gap-4">
          {experiments.map(({ name, status, question, test, learning, next, icon: Icon }, index) => (
            <article key={name} className="rounded-[30px] border border-white/[0.075] bg-white/[0.025] p-6 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
                <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] text-cyan-200"><Icon className="h-5 w-5" /></span><span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">EXP 0{index + 1}</span></div><h2 className="mt-6 text-3xl font-black tracking-[-0.04em]">{name}</h2><span className="mt-3 inline-flex rounded-full border border-cyan-300/15 px-3 py-1.5 text-xs font-black text-cyan-200">{status}</span><p className="mt-6 text-lg font-bold leading-8 text-zinc-200">{question}</p></div>
                <div className="grid gap-3 sm:grid-cols-3"><LabCell label="Prueba" text={test} /><LabCell label="Aprendizaje" text={learning} /><LabCell label="Siguiente decisión" text={next} /></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-cyan-500/[0.05] to-violet-500/[0.08] p-8 sm:p-10">
          <div className="flex items-center gap-3 text-cyan-200"><FlaskConical className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Criterio de salida</span></div>
          <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Lab no es una sala de espera para Projects.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-zinc-400">Una prueba avanza cuando el problema sigue siendo real, aparece evidencia útil y existe una razón clara para construir más. Si no, el aprendizaje se conserva y el experimento puede cerrarse.</p>
          <Link href="/central/projects" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">Ver lo que sí avanzó a Projects <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}

function LabCell({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">{label}</p><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></div>;
}
