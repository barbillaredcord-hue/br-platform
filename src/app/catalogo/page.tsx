import type { Metadata } from "next";
import Link from "next/link";
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

export default function CatalogoPage() {
  return (
    <main className="min-h-screen bg-[#09090d] text-[#f5f0e8]">
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-violet-400/10 sm:inset-5" />

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#09090d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/central" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider shadow-[0_0_32px_rgba(109,94,252,0.14)] transition group-hover:border-violet-300/30">
              BR
            </span>
            <span>
              <strong className="block text-sm tracking-[0.16em]">BR STUDIOS</strong>
              <span className="block text-[10px] uppercase tracking-[0.34em] text-zinc-500">Central</span>
            </span>
          </Link>

          <a
            href={generalWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-violet-300/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-4 py-2 text-sm font-bold text-violet-100 transition hover:border-violet-200/50 hover:bg-white/[0.06]"
          >
            Cotizar
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-8 sm:pt-24">
        <div className="max-w-4xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.34em] text-violet-300">
            Catálogo comercial
          </p>
          <h1 className="text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            Soluciones digitales para <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">hacer avanzar</span> tu negocio.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            Explora los servicios de BR STUDIOS Central. Cada opción explica qué resuelve, qué incluye y para quién está pensada. Cuando encuentres lo que necesitas, puedes abrir WhatsApp con el servicio ya identificado.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#servicios"
            className="rounded-full bg-[#f5f0e8] px-5 py-3 text-sm font-black text-[#0b0b10] transition hover:scale-[1.02]"
          >
            Ver servicios
          </a>
          <Link
            href="/central"
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-zinc-200 transition hover:border-white/20"
          >
            Conocer BR STUDIOS Central
          </Link>
        </div>
      </section>

      <section id="servicios" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8 border-t border-white/7 pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Toca para expandir</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Servicios principales</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {brStudioServices.map((service, index) => (
            <details
              key={service.slug}
              id={service.slug}
              open={index === 0}
              className="group overflow-hidden rounded-[26px] border border-white/8 bg-white/[0.028] shadow-[0_18px_70px_rgba(0,0,0,0.22)] open:border-violet-300/20 open:bg-white/[0.038]"
            >
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-5 p-6 sm:p-7 [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">{service.eyebrow}</p>
                  <h3 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">{service.title}</h3>
                  <p className="mt-2 leading-7 text-zinc-400">{service.tagline}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl font-light text-violet-200 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-white/7 px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                <p className="max-w-2xl leading-7 text-zinc-300">{service.description}</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/7 bg-black/15 p-5">
                    <h4 className="font-black">Qué incluye</h4>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                      {service.includes.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/7 bg-black/15 p-5">
                    <h4 className="font-black">Ideal para</h4>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                      {service.idealFor.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {service.benefits.map((benefit) => (
                    <div key={benefit} className="rounded-2xl border border-white/7 bg-white/[0.025] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">Beneficio</p>
                      <p className="mt-2 text-sm font-bold text-zinc-200">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={getWhatsAppUrl(service.whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-violet-300/35 bg-gradient-to-r from-blue-500/15 to-violet-500/15 px-5 py-3 text-sm font-black text-violet-100 shadow-[0_0_26px_rgba(124,92,255,0.12)] transition hover:border-violet-200/60"
                  >
                    Cotizar este servicio →
                  </a>
                  <a
                    href="#contacto"
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20"
                  >
                    Más información
                  </a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="overflow-hidden rounded-[30px] border border-violet-300/20 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.025] to-violet-500/[0.10] p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-300">Hablemos de tu proyecto</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">Cuéntanos qué quieres construir.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            No necesitas llegar con una especificación técnica. Cuéntanos el problema, la idea o el objetivo y te ayudamos a definir una solución clara.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={generalWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#f5f0e8] px-5 py-3 text-sm font-black text-[#0b0b10]"
            >
              Escribir por WhatsApp
            </a>
            <a
              href="https://instagram.com/brstudios_companion"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-zinc-200"
            >
              @brstudios_companion
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
