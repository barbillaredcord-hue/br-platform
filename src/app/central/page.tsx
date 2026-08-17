import type { Metadata } from "next";
import Link from "next/link";
import { brStudioServices, getWhatsAppUrl } from "@/lib/br-studios/catalog";

export const metadata: Metadata = {
  title: "BR STUDIOS Central",
  description:
    "Central de soluciones digitales, acompañamiento de proyectos y desarrollo para negocios, marcas y productos.",
};

const whatsapp = getWhatsAppUrl(
  "Hola BR STUDIOS, quiero contarles una idea o proyecto y conocer cómo pueden ayudarme.",
);

export default function CentralPage() {
  return (
    <main className="min-h-screen bg-[#09090d] text-[#f5f0e8]">
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-blue-400/10 sm:inset-5" />

      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider">BR</span>
            <span>
              <strong className="block text-sm tracking-[0.16em]">BR STUDIOS</strong>
              <span className="block text-[10px] uppercase tracking-[0.34em] text-zinc-500">Central</span>
            </span>
          </Link>
          <Link
            href="/catalogo"
            className="rounded-full border border-violet-300/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-4 py-2 text-sm font-black text-violet-100"
          >
            Ver catálogo
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
        <div className="max-w-4xl">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-blue-300">BR STUDIOS Central</p>
          <h1 className="text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            Ideas, proyectos y negocios acompañados de principio a <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">evolución</span>.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            BR STUDIOS Central reúne desarrollo, diseño, estrategia y continuidad para ayudarte a construir una solución digital, mejorar un proyecto existente o preparar un negocio para salir al mundo.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/catalogo" className="rounded-full bg-[#f5f0e8] px-5 py-3 text-sm font-black text-[#0b0b10]">Explorar servicios</Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-zinc-200">Contar mi idea</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Crear", "Desde una idea inicial hasta una primera versión funcional y presentable."],
            ["Mejorar", "Ordenamos, refinamos y hacemos evolucionar proyectos que ya existen."],
            ["Acompañar", "Documentación, continuidad, lanzamiento, presencia digital y crecimiento."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[24px] border border-white/8 bg-white/[0.028] p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-300">Capacidad</p>
              <h2 className="mt-3 text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-7 border-t border-white/7 pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Servicios</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Soluciones que pueden crecer contigo</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brStudioServices.map((service) => (
            <Link
              key={service.slug}
              href={`/catalogo#${service.slug}`}
              className="group rounded-[22px] border border-white/8 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.04]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">{service.eyebrow}</p>
              <h3 className="mt-3 text-xl font-black">{service.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{service.tagline}</p>
              <span className="mt-5 inline-block text-sm font-bold text-zinc-300 group-hover:text-violet-200">Ver servicio →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="rounded-[30px] border border-violet-300/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.025] to-violet-500/[0.10] p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-300">Siguiente paso</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">No necesitas saber cómo construirlo. Empieza por contarnos qué necesitas lograr.</h2>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-[#f5f0e8] px-5 py-3 text-sm font-black text-[#0b0b10]">Hablar por WhatsApp</a>
            <Link href="/catalogo" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-zinc-200">Abrir catálogo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
