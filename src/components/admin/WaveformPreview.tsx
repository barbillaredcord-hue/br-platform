const bars = [
  "h-[24%]",
  "h-[42%]",
  "h-[60%]",
  "h-[36%]",
  "h-[72%]",
  "h-[48%]",
  "h-[82%]",
  "h-[54%]",
  "h-[35%]",
  "h-[65%]",
  "h-[88%]",
  "h-[40%]",
  "h-[58%]",
  "h-[76%]",
  "h-[44%]",
  "h-[68%]",
  "h-[92%]",
  "h-[52%]",
  "h-[30%]",
  "h-[70%]",
  "h-[46%]",
  "h-[84%]",
  "h-[62%]",
  "h-[38%]",
  "h-[78%]",
  "h-[50%]",
  "h-[66%]",
  "h-[90%]",
  "h-[56%]",
  "h-[34%]",
];

type WaveformPreviewProps = {
  previewDurationSeconds?: number;
};

export function WaveformPreview({ previewDurationSeconds = 15 }: WaveformPreviewProps) {
  const safePreviewDurationSeconds = Math.min(30, Math.max(15, Math.round(previewDurationSeconds || 15)));
  return (
    <div className="relative rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
        <span>0:00</span>
        <span className="text-cyan-200">Preview: {safePreviewDurationSeconds} segundos</span>
        <span>0:30</span>
      </div>
      <div className="relative flex h-48 items-center gap-1 overflow-hidden rounded-lg bg-black/30 px-4">
        <div className="absolute left-[22%] top-0 h-full w-0.5 bg-cyan-300" />
        <div className="absolute left-[64%] top-0 h-full w-0.5 bg-cyan-300" />
        <div className="absolute left-[22%] top-3 rounded-md bg-cyan-300 px-2 py-1 text-xs font-bold text-black">Inicio</div>
        <div className="absolute left-[64%] top-3 rounded-md bg-cyan-300 px-2 py-1 text-xs font-bold text-black">Fin</div>
        {bars.map((heightClass, index) => (
          <div
            key={`${heightClass}-${index}`}
            className={`flex-1 rounded-full bg-cyan-300/70 ${heightClass}`}
          />
        ))}
      </div>
    </div>
  );
}
