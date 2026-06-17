"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DownloadBeatButtonProps = {
  beatId: string;
  fileName?: string;
  className?: string;
  children?: React.ReactNode;
};

function safeFileName(input?: string | null) {
  return (input || "br-beat")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "br-beat";
}

function getFileNameFromContentDisposition(contentDisposition: string | null, fallbackName?: string) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i);
  return match?.[1] || `${safeFileName(fallbackName)}.mp3`;
}

export default function DownloadBeatButton({ beatId, fileName, className, children }: DownloadBeatButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDownload() {
    if (isDownloading) {
      return;
    }

    setMessage("");

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase no está configurado.");
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (error || !token) {
      setMessage("Inicia sesión para descargar este beat.");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(`/api/beats/${encodeURIComponent(beatId)}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "No se pudo descargar este beat.";

        try {
          const payload = await response.json();
          errorMessage = payload.message || errorMessage;
        } catch {
          // Keep fallback message when the response is not JSON.
        }

        setMessage(errorMessage);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const downloadName = getFileNameFromContentDisposition(response.headers.get("content-disposition"), fileName);
      const link = document.createElement("a");

      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      setMessage("");
    } catch {
      setMessage("No se pudo preparar la descarga.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button type="button" onClick={handleDownload} disabled={isDownloading} className={className}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {isDownloading ? "Preparando..." : children || "Descargar MP3"}
      </button>
      {message ? <p className="max-w-xs text-xs text-red-300">{message}</p> : null}
    </div>
  );
}
