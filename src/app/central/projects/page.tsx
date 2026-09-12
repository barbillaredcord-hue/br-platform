import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FlaskConical, Layers3, RadioTower, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "BR Projects | BR STUDIOS Central",
  description: "Proyectos reales de BR STUDIOS explicados desde el problema que los originó hasta su evolución actual.",
};

const projects = [
  {
    name: "BRTuNegocio / ALUXOR",
    stage: "Sistema en evolución",
    why: "Un negocio no debería depender de hojas separadas, mensajes y memoria para saber qué compró, qué recibió y qué tiene disponible.",
    problem: "Operación fragmentada entre compras, recepción, inventario y seguimiento por proyecto.",
    solution: "ERP modular con recepción durable, inventario, compras, sincronización y operación por proyecto.",
    evolution: "De control operativo básico a una arquitectura por dominio preparada para trabajo remoto, offline y múltiples flujos.",
    accent: "Operación",
    icon: Layers3,
  },
  {
    name: "BR Platform",
    stage: "Producto activo",
    why: "La música necesitaba un espacio propio donde el acceso, los beats, las licencias y la experiencia del artista pudieran vivir juntos.",
    problem: "Contenido musical disperso y procesos de acceso/licencias difíciles de controlar.",
    solution: "Plataforma musical privada con catálogo de beats, análisis, accesos y herramientas para artistas.",
    evolution: "De reproductor de beats a una plataforma que puede convertirse en la base digital de artistas y lanzamientos.",
    accent: "Música",
    icon: Sparkles,
  },
  {
    name: "WiFi Monitor",
    stage: "Laboratorio funcional",
    why: "Ver una red no debería limitarse a una lista de IPs; debería ayudar a entender qué está conectado y qué cambió.",
    problem: "Poca visibilidad de dispositivos, identidad cambiante por IP y dificultad para detectar nuevos equipos.",
    solution: "Monitor local con identidad por MAC, historial, servicios, alertas y herramientas de diagnóstico de red.",
    evolution: "De escáner LAN a radar operativo con presencia, cámaras, router access y acceso remoto privado.",
    accent: "Infraestructura",
    icon: RadioTower,
  },
  {
    name: "BR Remote Terminal",
    stage: "Laboratorio privado",
    why: "Trabajar lejos de la Mac no debería significar perder acceso a las herramientas locales importantes.",
    problem: "Necesidad de administrar servicios locales sin exponer una terminal completa de forma pública.",
    solution: "Acceso remoto privado apoyado en Tailscale y autorización del dispositivo.",
    evolution: "De acceso local a una futura consola privada para operar herramientas BR desde dispositivos autorizados.",
    accent: "Acceso",
    icon: FlaskConical,
  },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_15%_12%,rgba(80,108,255,0.13),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(161,86,255,0.12),transparent_30%)]" />

      <header className="relative z-10 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/central" className="inline-flex items-center gap-2 text-sm font-black text-zinc-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> BR Central
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-300">BR Projects</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-300">No solo qué hicimos. Por qué tuvo sentido hacerlo.</p>
        <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-7xl">
          Cada proyecto empieza con un problema que vale la pena recordar.
        </h1>
        <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
          BR Projects documenta el motivo detrás de cada sistema, cómo se convirtió en una solución y qué ha cambiado desde su primera versión. El objetivo no es presumir funciones: es conservar el criterio que dio origen al proyecto.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5">
          {projects.map(({ name, stage, why, problem, solution, evolution, accent, icon: Icon }, index) => (
            <article key={name} className="relative overflow-hidden rounded-[30px] border border-white/[0.075] bg-white/[0.026] p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/[0.07] blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-blue-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-500">0{index + 1} · {accent}</span>
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{name}</h2>
                  <p className="mt-3 inline-flex rounded-full border border-blue-300/15 bg-blue-400/[0.05] px-3 py-1.5 text-xs font-black text-blue-200">{stage}</p>
                  <p className="mt-7 text-lg font-bold leading-8 text-zinc-200">{why}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Problema</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{problem}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">Solución</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{solution}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">Evolución</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{evolution}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.06] to-violet-500/[0.08] p-8 sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">La idea de BR Central</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">Idea → experimento → producto → sistema real.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-zinc-400">BR Projects es el puente entre lo que se prueba en BR Lab y lo que eventualmente puede convertirse en una solución de BR Studios.</p>
          <Link href="/central" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">
            Volver a Central <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
