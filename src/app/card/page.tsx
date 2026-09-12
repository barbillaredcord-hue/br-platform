"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";

export default function BRCardPage() {
  const [status, setStatus] = useState("Mac registrada");
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  async function registerThisMac() {
    setBusy(true);
    setStatus("Preparando Touch ID...");

    try {
      const optionsRes = await fetch(
        "/api/card/webauthn/register/options",
        { cache: "no-store" }
      );

      const optionsJSON = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(optionsJSON.error || "No se pudo iniciar el registro");
      }

      const registrationResponse = await startRegistration({
        optionsJSON,
      });

      const verifyRes = await fetch(
        "/api/card/webauthn/register/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationResponse),
        }
      );

      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error || "No se pudo registrar esta Mac");
      }

      setStatus("Esta Mac quedó registrada correctamente");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Error durante el registro"
      );
    } finally {
      setBusy(false);
    }
  }

  async function unlockBRCard() {
    setBusy(true);
    setStatus("Preparando Touch ID...");

    try {
      const optionsRes = await fetch(
        "/api/card/webauthn/auth/options",
        { cache: "no-store" }
      );

      const optionsJSON = await optionsRes.json();

      if (!optionsRes.ok) {
        if (optionsRes.status === 409) {
          setStatus("Esta Mac necesita registrarse primero");
          return;
        }

        throw new Error(optionsJSON.error || "No se pudo iniciar Touch ID");
      }

      setStatus("Confirma con Touch ID...");

      const authenticationResponse = await startAuthentication({
        optionsJSON,
      });

      const verifyRes = await fetch(
        "/api/card/webauthn/auth/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authenticationResponse),
        }
      );

      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error || "Touch ID no fue válido");
      }

      setUnlocked(true);
      setStatus("BR Card desbloqueado");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No se pudo desbloquear BR Card"
      );
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <main className="min-h-screen bg-[#09090b] px-6 py-10 text-white">
        <section className="mx-auto max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-300">
            BR STUDIOS
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-[-0.06em]">
            BR Card
          </h1>

          <p className="mt-4 text-emerald-300">
            Acceso autorizado con Touch ID
          </p>

          <div className="mt-10 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7">
            <label
              htmlFor="card-number"
              className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400"
            >
              Número de tarjeta
            </label>

            <input
              id="card-number"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              className="mt-3 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-5 py-4 text-lg tracking-[0.12em] text-white outline-none"
            />

            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("card-number") as HTMLInputElement | null;
                const number = input?.value.replace(/\s/g, "") || "";

                if (number === "5101257820841826") {
                  alert("Tarjeta encontrada\\nTitular: Titular de prueba\\nEstado: Activa\\nSaldo: $1,250.00");
                } else {
                  alert("Tarjeta no encontrada");
                }
              }}
              className="mt-4 w-full rounded-2xl bg-blue-500 px-5 py-4 text-sm font-black text-white"
            >
              Consultar tarjeta
            </button>

            <p className="mt-5 text-xs text-zinc-500">
              La consulta real de titular, saldo y estado se conectará en la siguiente etapa.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
      <section className="w-full max-w-md text-center">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-300">
          BR STUDIOS
        </p>

        <h1 className="mt-4 text-5xl font-black tracking-[-0.06em]">
          BR Card
        </h1>

        <p className="mt-4 text-zinc-400">
          Acceso privado
        </p>

        <div className="mt-10 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7">
          <button
            type="button"
            onClick={unlockBRCard}
            disabled={busy}
            className="w-full rounded-2xl bg-blue-500 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-400 disabled:opacity-40"
          >
            {busy
              ? "Esperando Touch ID..."
              : "Desbloquear BR Card con Touch ID"}
          </button>

          <button
            type="button"
            onClick={registerThisMac}
            disabled={busy}
            className="mt-3 w-full rounded-2xl border border-white/[0.08] px-5 py-4 text-sm font-bold text-zinc-400"
          >
            Registrar esta Mac otra vez
          </button>

          <p className="mt-5 text-sm text-zinc-500">
            {status}
          </p>
        </div>
      </section>
    </main>
  );
}
