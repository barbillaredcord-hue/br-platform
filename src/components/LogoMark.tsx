type LogoMarkProps = {
  compact?: boolean;
};

export function LogoMark({ compact = false }: LogoMarkProps) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-cyan-300 font-black text-black ${
        compact ? "h-10 w-10" : "h-11 w-11 text-lg"
      }`}
    >
      B.R
    </div>
  );
}
