import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Globe2,
  Instagram,
  MessageCircle,
} from "lucide-react";
import {
  brStudioServices,
  getWhatsAppUrl,
} from "@/lib/br-studios/catalog";

export const metadata: Metadata = {
  title: "Catálogo de servicios | BR STUDIOS Central",
  description:
    "Páginas web, aplicaciones, e-commerce, sistemas a la medida, UI/UX y automatización para negocios, marcas y proyectos.",
};

const generalWhatsapp = getWhatsAppUrl(
  "Hola BR STUDIOS, vi su catálogo y quiero información sobre sus servicios.",
);

const needs = [
  ["Quiero presencia digital", "paginas-web"],
  ["Quiero vender en línea", "e-commerce"],
  ["Quiero organizar mi negocio", "sistemas-a-la-medida"],
  ["Necesito una app o plataforma", "aplicaciones"],
];

export default function CatalogoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[780px] bg-[radial-gradient(circle_at_12%_12%,rgba(80,97,255,0.14),transparent_30%),radial-gradient(circle_at_88%_9%,rgba(164,86,255,0.13),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-white/[0.055] sm:inset-5" />

      <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-[#09090b]/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/central" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider shadow-[0_0_30px_rgba(108,92,255,0.10)] transition group-hover:border-violet-300/25">
              BR
            </span>
            <span>
              <strong className="block text-sm tracking-[0.18em]">BR STUDIOS</strong>
              <span className="block text-[10px] uppercase tracking-[0.36em] text-zinc-500">Central</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/central" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white sm:inline-flex">
              Central
            </Link>
            <a href={generalWhatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-4 py-2 text-sm font-black text-violet-100 shadow-[0_0_28px_rgba(112,89,255,0.12)]">
              Cotizar <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 sm:pt-28">
        <div className="max-w-5xl">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 shadow-[0_0_18px_rgba(120,100,255,0.8)]" />
            Catálogo comercial
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-[6.2rem]">
            Soluciones digitales para <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent">hacer avanzar</span> tu negocio.
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            Explora servicios de desarrollo, diseño y automatización pensados alrededor de lo que realmente quieres lograr. Cada servicio puede abrirse, entenderse y cotizarse directamente por WhatsApp.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#servicios" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-6 py-3.5 text-sm font-black text-[#09090b] transition hover:scale-[1.015]">
            Ver servicios <ChevronRight className="h-4 w-4" />
          </a>
          <a href={generalWhatsapp} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.025] px-6 py-3.5 text-sm font-bold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.045]">
            No sé cuál necesito
          </a>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-5 sm:p-7">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">Empieza por tu objetivo</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">¿Qué necesitas lograr?</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500">No necesitas conocer el nombre técnico del servicio. Elige la necesidad más cercana.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {needs.map(([label, slug]) => (
              <a key={slug} href={`#${slug}`} className="group flex min-h-28 items-end justify-between gap-4 rounded-[20px] border border-white/[0.07] bg-black/10 p-5 transition hover:-translate-y-1 hover:border-violet-300/20 hover:bg-white/[0.035]">
                <span className="max-w-[13rem] font-black leading-6">{label}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 border-t border-white/[0.07] pt-9 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Toca para expandir</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Servicios principales</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-zinc-500">Cada servicio muestra qué resuelve, qué incluye, para quién está pensado y su cotización directa.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {brStudioServices.map((service, index) => (
            <details
              key={service.slug}
              id={service.slug}
              open={index === 0}
              className="group overflow-hidden rounded-[28px] border border-white/[0.075] bg-gradient-to-b from-white/[0.032] to-white/[0.018] shadow-[0_22px_80px_rgba(0,0,0,0.28)] transition open:border-violet-300/20 open:bg-white/[0.038]"
            >
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-5 p-6 sm:p-7 [&::-webkit-details-marker]:hidden">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-700">0{index + 1}</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">{service.eyebrow}</p>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{service.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-zinc-400">{service.tagline}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl font-light text-violet-200 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-white/[0.07] px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                <p className="max-w-2xl text-[15px] leading-7 text-zinc-300">{service.description}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-white/[0.07] bg-black/15 p-5">
                    <h4 className="font-black">Qué incluye</h4>
                    <ul className="mt-4 space-y-2.5 text-sm leading-6 text-zinc-400">
                      {service.includes.map((item) => (
                        <li key={item} className="flex gap-2"><span className="text-violet-300">•</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[20px] border border-white/[0.07] bg-black/15 p-5">
                    <h4 className="font-black">Ideal para</h4>
                    <ul className="mt-4 space-y-2.5 text-sm leading-6 text-zinc-400">
                      {service.idealFor.map((item) => (
                        <li key={item} className="flex gap-2"><span className="text-blue-300">•</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {service.benefits.map((benefit) => (
                    <div key={benefit} className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">Beneficio</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-zinc-200">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={getWhatsAppUrl(service.whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-5 py-3 text-sm font-black text-violet-100 shadow-[0_0_26px_rgba(124,92,255,0.12)] transition hover:border-violet-200/60"
                  >
                    Cotizar este servicio <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a href="#contacto" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20">
                    Más información
                  </a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="contacto" className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-violet-300/20 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-violet-500/[0.09] p-8 sm:p-11">
          <div className="absolute -right-20 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-violet-300">Hablemos de tu proyecto</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl">Cuéntanos qué quieres construir.</h2>
          <p className="mt-5 max-w-2xl leading-7 text-zinc-400">No necesitas llegar con una especificación técnica. Cuéntanos el problema, la idea o el objetivo y te ayudamos a definir una solución clara.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={generalWhatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-6 py-3.5 text-sm font-black text-[#09090b]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href="https://instagram.com/brstudios_companion" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3.5 text-sm font-bold text-zinc-200">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a href="https://www.brstudios.org" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3.5 text-sm font-bold text-zinc-200">
              <Globe2 className="h-4 w-4" /> brstudios.org
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
