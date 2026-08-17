import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers3, Orbit, Sparkles } from "lucide-react";
import { brStudioServices, getWhatsAppUrl } from "@/lib/br-studios/catalog";

export const metadata: Metadata = {
  title: "BR STUDIOS Central",
  description:
    "Central de soluciones digitales, acompañamiento de proyectos y desarrollo para negocios, marcas y productos.",
};

const whatsapp = getWhatsAppUrl(
  "Hola BR STUDIOS, quiero contarles una idea o proyecto y conocer cómo pueden ayudarme.",
);

const pillars = [
  {
    icon: Sparkles,
    title: "Crear",
    text: "Desde una idea inicial hasta una primera versión funcional, presentable y lista para evolucionar.",
  },
  {
    icon: Layers3,
    title: "Mejorar",
    text: "Ordenamos, refinamos y fortalecemos proyectos que ya existen sin perder su esencia ni su historia.",
  },
  {
    icon: Orbit,
    title: "Acompañar",
    text: "Documentación, continuidad, lanzamiento, presencia digital y crecimiento a lo largo del proyecto.",
  },
];

export default function CentralPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_15%_15%,rgba(85,96,255,0.14),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(164,88,255,0.13),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-white/[0.055] sm:inset-5" />

      <header className="relative z-20 border-b border-white/[0.055] bg-[#09090b]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider shadow-[0_0_30px_rgba(108,92,255,0.10)] transition group-hover:border-violet-300/25">
              BR
            </span>
            <span>
              <strong className="block text-sm tracking-[0.18em]">BR STUDIOS</strong>
              <span className="block text-[10px] uppercase tracking-[0.36em] text-zinc-500">Central</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/catalogo" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white sm:inline-flex">
              Servicios
            </Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-4 py-2 text-sm font-black text-violet-100 shadow-[0_0_28px_rgba(112,89,255,0.12)]">
              Hablemos <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-28">
        <div className="grid items-end gap-12 lg:grid-cols-[1.05fr_.65fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 shadow-[0_0_18px_rgba(120,100,255,0.8)]" />
              Estudio creativo + ingeniería de producto
            </div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-[6.35rem]">
              Construimos ideas que puedan <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent">vivir, crecer y evolucionar.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
              BR STUDIOS Central reúne desarrollo, diseño, estrategia y continuidad para convertir una idea, un proyecto existente o un negocio en una solución digital clara, útil y preparada para crecer.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/catalogo" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-6 py-3.5 text-sm font-black text-[#09090b] transition hover:scale-[1.015]">
                Explorar catálogo <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.025] px-6 py-3.5 text-sm font-bold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.045]">
                Contar mi idea
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-white/[0.028] p-7 shadow-[0_30px_100px_rgba(0,0,0,.36)]">
            <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">Nuestra forma de trabajar</p>
            <p className="mt-5 text-3xl font-black tracking-[-0.04em]">No vendemos piezas aisladas.</p>
            <p className="mt-4 leading-7 text-zinc-400">Entendemos el proyecto, lo estructuramos y construimos lo que realmente necesita para avanzar.</p>
            <div className="mt-7 border-t border-white/[0.07] pt-6 text-sm text-zinc-500">
              Idea → definición → diseño → desarrollo → lanzamiento → evolución
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <article key={title} className="group rounded-[26px] border border-white/[0.075] bg-gradient-to-b from-white/[0.035] to-white/[0.018] p-6 transition hover:-translate-y-1 hover:border-violet-300/20">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-violet-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.035em]">{title}</h2>
              <p className="mt-3 leading-7 text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 border-t border-white/[0.07] pt-9 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Catálogo de servicios</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">Soluciones diseñadas alrededor de lo que necesitas lograr.</h2>
          </div>
          <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm font-black text-violet-200">
            Ver catálogo completo <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brStudioServices.map((service, index) => (
            <Link key={service.slug} href={`/catalogo#${service.slug}`} className="group relative overflow-hidden rounded-[24px] border border-white/[0.075] bg-white/[0.023] p-6 transition hover:-translate-y-1 hover:border-violet-300/25 hover:bg-white/[0.037]">
              <span className="absolute right-5 top-5 text-[11px] font-black text-zinc-700">0{index + 1}</span>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-300">{service.eyebrow}</p>
              <h3 className="mt-7 text-2xl font-black tracking-[-0.035em]">{service.title}</h3>
              <p className="mt-3 min-h-14 text-sm leading-6 text-zinc-500">{service.tagline}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-300 transition group-hover:text-violet-200">
                Ver servicio <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-violet-300/20 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-violet-500/[0.09] p-8 sm:p-11">
          <div className="absolute -right-20 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-violet-300">Siguiente paso</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl">No necesitas saber cómo construirlo. Empieza por decirnos qué quieres lograr.</h2>
          <p className="mt-5 max-w-2xl leading-7 text-zinc-400">A partir de ahí definimos contigo la solución, el alcance y la mejor forma de llevarla a una versión real.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-6 py-3.5 text-sm font-black text-[#09090b]">
              Hablar por WhatsApp <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link href="/catalogo" className="rounded-full border border-white/10 px-6 py-3.5 text-sm font-bold text-zinc-200">Abrir catálogo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
