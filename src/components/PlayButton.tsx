import { Play } from "lucide-react";

type PlayButtonProps = {
  children?: React.ReactNode;
  variant?: "primary" | "light" | "circle";
  className?: string;
  ariaLabel?: string;
};

const variants = {
  primary: "h-11 gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200",
  light: "h-10 w-full gap-2 rounded-md bg-white text-sm font-bold text-black hover:bg-cyan-200",
  circle: "h-11 w-11 rounded-full bg-cyan-300 text-black hover:bg-cyan-200",
};

export function PlayButton({
  children,
  variant = "primary",
  className = "",
  ariaLabel,
}: PlayButtonProps) {
  return (
    <button
      className={`flex items-center justify-center transition ${variants[variant]} ${className}`}
      aria-label={ariaLabel}
    >
      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
      {children}
    </button>
  );
}
