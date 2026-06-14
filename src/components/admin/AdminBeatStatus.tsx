import type { BeatStatus } from "@/data/beats";

const statusStyles: Record<BeatStatus, string> = {
  "Público Preview": "border-cyan-300/30 text-cyan-200",
  Privado: "border-white/15 text-zinc-300",
  Exclusivo: "border-amber-300/30 text-amber-200",
};

export function AdminBeatStatus({ status }: { status: BeatStatus }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
