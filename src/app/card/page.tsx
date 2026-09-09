"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const demoCards = [
  {
    number: "1111222233334444",
    owner: "Titular de prueba",
    status: "Activa",
    contactHint: "*** *** 4821",
  },
];

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16);
}

function formatCardNumber(value: string) {
  return value.replace(/(.{4})/g, "$1 ").trim();
}

export default function BRCardPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [searchedNumber, setSearchedNumber] = useState("");

  const result = useMemo(
    () => demoCards.find((card) => card.number === searchedNumber) ?? null,
    [searchedNumber],
  );

  const hasSearched = searchedNumber.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchedNumber(normalizeCardNumber(cardNumber));
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-6 text-[#f3eee6] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <Link href="/" className="text-sm font-bold text-zinc-400 transition hover:text-white">
            BR STUDIOS
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-300">
            BR Card
          </span>
        </header>

        <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-300">
              Consulta de tarjeta encontrada
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] sm:text-6xl">
              BR Card
            </h1>
            <p className="mt-4 leading-7 text-zinc-400">
              Escribe el numero de tarjeta para identificar al titular y poder devolversela.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-9 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:p-8"
          >
            <label htmlFor="card-number" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              Numero de tarjeta
            </label>
            <input
              id="card-number"
              value={formatCardNumber(cardNumber)}
              onChange={(event) => setCardNumber(normalizeCardNumber(event.target.value))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000 0000 0000 0000"
              className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-5 py-4 text-lg tracking-[0.12em] text-white outline-none placeholder:text-zinc-700 focus:border-blue-300/30"
            />
            <button
              type="submit"
              disabled={normalizeCardNumber(cardNumber).length !== 16}
              className="mt-4 w-full rounded-2xl bg-blue-500 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Consultar
            </button>
          </form>

          {result ? (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-blue-300/15 bg-gradient-to-br from-blue-500/[0.09] via-white/[0.025] to-violet-500/[0.08] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
                Esta tarjeta pertenece a
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                {result.owner}
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Estado</p>
                  <p className="mt-2 text-lg font-black text-emerald-300">{result.status}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Contacto de referencia</p>
                  <p className="mt-2 text-lg font-black text-white">{result.contactHint}</p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-zinc-500">
                Datos de prueba. El saldo y otros datos sensibles se mostraran solo en una vista autenticada.
              </p>
            </section>
          ) : hasSearched ? (
            <div className="mt-6 rounded-[24px] border border-red-300/10 bg-red-500/[0.05] p-5 text-sm text-red-200">
              No encontramos una tarjeta registrada con ese numero.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
