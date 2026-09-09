"use client";

import { useMemo, useState } from "react";
import { AppWindow, Fingerprint, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useUser } from "@/context/UserContext";

const STORAGE_KEY = "br-central-owner-passkey-v1";

const PRIVATE_APPS = [
  {
    name: "BR Platform",
    description: "Plataforma musical y núcleo actual de BR STUDIOS.",
    url: "https://brstudios.org",
  },
  {
    name: "AnunciaPro",
    description: "Proyecto publicado desde ALUXOR.",
    url: "https://anunciapro.vercel.app",
  },
  {
    name: "Legal Contable",
    description: "Aplicación legal y contable.",
    url: "https://legal-contable-app.vercel.app",
  },
  {
    name: "Wallet Glow Link",
    description: "Wallet publicada en Vercel.",
    url: "https://wallet-glow-link-wallet.vercel.app",
  },
] as const;

function randomBytes(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function PrivateAppsMenu() {
  const { isAdmin, isLoadingSession } = useUser();
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supportsWebAuthn = useMemo(
    () => typeof window !== "undefined" && "PublicKeyCredential" in window && !!navigator.credentials,
    [],
  );

  async function unlockWithBiometrics() {
    if (busy) return;
    setMessage(null);

    if (!isAdmin) {
      setMessage("Inicia sesión con la cuenta administradora de BR para continuar.");
      return;
    }

    if (!supportsWebAuthn) {
      setMessage("Este navegador no permite Touch ID / Face ID mediante WebAuthn.");
      return;
    }

    setBusy(true);

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setMessage("No encontré un autenticador biométrico disponible en este dispositivo.");
        return;
      }

      const savedCredentialId = localStorage.getItem(STORAGE_KEY);

      if (!savedCredentialId) {
        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge: randomBytes(),
            rp: { name: "BR STUDIOS Central", id: window.location.hostname },
            user: {
              id: randomBytes(24),
              name: "br-central-owner",
              displayName: "B.R CEO",
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },
              { type: "public-key", alg: -257 },
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              residentKey: "required",
              requireResidentKey: true,
              userVerification: "required",
            },
            timeout: 60000,
            attestation: "none",
          },
        })) as PublicKeyCredential | null;

        if (!credential) throw new Error("No se pudo crear la credencial biométrica.");
        localStorage.setItem(STORAGE_KEY, bytesToBase64Url(credential.rawId));
      } else {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: randomBytes(),
            allowCredentials: [
              {
                type: "public-key",
                id: base64UrlToBytes(savedCredentialId),
                transports: ["internal"],
              },
            ],
            userVerification: "required",
            timeout: 60000,
          },
        });

        if (!assertion) throw new Error("No se completó la verificación biométrica.");
      }

      setUnlocked(true);
      setOpen(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError") {
        setMessage("Verificación cancelada o no autorizada.");
      } else {
        setMessage(error instanceof Error ? error.message : "No se pudo verificar tu identidad.");
      }
    } finally {
      setBusy(false);
    }
  }

  function closeMenu() {
    setOpen(false);
    setUnlocked(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={unlockWithBiometrics}
        disabled={busy || isLoadingSession}
        className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/[0.06] px-4 py-2 text-sm font-black text-blue-100 transition hover:border-blue-200/35 hover:bg-blue-400/[0.10] disabled:cursor-wait disabled:opacity-60"
        title="Apps privadas"
      >
        <Fingerprint className="h-4 w-4" />
        <span className="hidden sm:inline">Mis Apps</span>
      </button>

      {message ? (
        <div className="fixed right-4 top-24 z-50 max-w-sm rounded-2xl border border-amber-300/20 bg-[#111216]/95 px-4 py-3 text-sm text-amber-100 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
            <button type="button" onClick={() => setMessage(null)} className="ml-auto text-zinc-500 hover:text-white" aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {open && unlocked ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/75 px-4 py-20 backdrop-blur-md sm:items-center sm:py-8">
          <section className="relative w-full max-w-3xl overflow-hidden rounded-[30px] border border-blue-300/20 bg-[#0b0c10] p-6 shadow-[0_35px_120px_rgba(0,0,0,.7)] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Identidad verificada
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white">Mis Apps</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Acceso privado de BR Central. Esta sesión se vuelve a bloquear al cerrar el menú.</p>
              </div>
              <button type="button" onClick={closeMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white" aria-label="Cerrar apps privadas">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
              {PRIVATE_APPS.map((app) => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[22px] border border-white/[0.075] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-blue-400/[0.045]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-blue-200">
                      <AppWindow className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-600 transition group-hover:text-blue-300">Abrir ↗</span>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-white">{app.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{app.description}</p>
                </a>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
