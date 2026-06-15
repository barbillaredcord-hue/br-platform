"use client";

import { useEffect, useState } from "react";
import { AuthControls } from "./AuthControls";
import { LogoMark } from "./LogoMark";
import { isSupabaseReadyForAdmin, SUPABASE_CONNECTION_STATUS_EVENT, SUPABASE_CONNECTION_STATUS_KEY, type SupabaseConnectionStatus } from "@/lib/supabase/config";

function getStoredSupabaseStatus(): SupabaseConnectionStatus {
  if (typeof window === "undefined") {
    return "pending";
  }

  const status = window.localStorage.getItem(SUPABASE_CONNECTION_STATUS_KEY);

  return status === "connected" || status === "error" ? status : "pending";
}

export function Header() {
  const supabaseReady = isSupabaseReadyForAdmin();
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>("pending");
  const headerStatus = supabaseReady ? supabaseStatus : "pending";
  const statusLabel = headerStatus === "connected" ? "🟢 Supabase conectado" : headerStatus === "error" ? "🔴 Supabase error" : "🟠 Supabase pendiente";

  useEffect(() => {
    const syncStatus = () => setSupabaseStatus(getStoredSupabaseStatus());

    syncStatus();
    window.addEventListener("storage", syncStatus);
    window.addEventListener(SUPABASE_CONNECTION_STATUS_EVENT, syncStatus);

    return () => {
      window.removeEventListener("storage", syncStatus);
      window.removeEventListener(SUPABASE_CONNECTION_STATUS_EVENT, syncStatus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050607]/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoMark compact />
            <span className="font-semibold">Beat Room</span>
          </div>
          <div className="hidden text-2xl font-black lg:block">B.R</div>
        </div>

        <div className="flex flex-1 flex-col gap-3 md:max-w-4xl md:flex-row md:items-end">
          <div className="inline-flex h-11 shrink-0 items-center rounded-md border border-white/10 bg-white/5 px-3 text-xs font-bold text-zinc-200">
            {statusLabel}
          </div>
          <label className="sr-only" htmlFor="search">
            Buscar beats
          </label>
          <input
            id="search"
            type="search"
            placeholder="Buscar beats, género o BPM"
            className="h-11 w-full rounded-md border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-300"
          />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
