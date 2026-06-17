"use client";

import { useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DownloadLicenseButtonProps = {
  beatId: string;
  fileName?: string;
  className?: string;
  children?: ReactNode;
};

function safeFileName(input?: string) {
  return (
    (input || "br-license")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "br-license"
  );
}

export default function DownloadLicenseButton({ beatId, fileName, className, children }: DownloadLicenseButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");

  async function downloadLicense() {
    setIsDownloading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setMessage("Supabase no está configurado.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("Inicia sesión para descargar la licencia.");
        return;
      }

      const response = await fetch(`/api/beats/${encodeURIComponent(beatId)}/license`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setMessage(error?.message ?? "No se pudo descargar la licencia.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${safeFileName(fileName)}-license.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Licencia descargada.");
    } catch {
      setMessage("No se pudo descargar la licencia.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" disabled={isDownloading} onClick={() => void downloadLicense()} className={className}>
        {isDownloading ? "Preparando licencia..." : children ?? "Descargar licencia"}
      </button>
      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
