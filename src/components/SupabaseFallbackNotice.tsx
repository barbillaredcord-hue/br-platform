"use client";

import { useUser } from "@/context/UserContext";

export function SupabaseFallbackNotice() {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">
      Usando fallback local: Supabase no devolvió beats activos.
    </div>
  );
}
