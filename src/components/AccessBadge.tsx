import { Lock } from "lucide-react";

export function AccessBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200"
      aria-label="Requiere acceso"
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      LOCK
    </span>
  );
}
