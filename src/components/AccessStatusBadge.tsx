import { Check, Lock } from "lucide-react";

type AccessStatusBadgeProps = {
  hasAccess: boolean;
};

export function AccessStatusBadge({ hasAccess }: AccessStatusBadgeProps) {
  if (hasAccess) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-200">
        <Check className="h-3 w-3" aria-hidden="true" />
        Acceso completo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-zinc-300">
      <Lock className="h-3 w-3" aria-hidden="true" />
      Solo preview
    </span>
  );
}
