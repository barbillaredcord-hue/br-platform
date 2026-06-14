const bars = [24, 42, 60, 36, 72, 48, 82, 54, 35, 65, 88, 40, 58, 76, 44, 68, 92, 52, 30, 70, 46, 84, 62, 38, 78, 50, 66, 90, 56, 34];

export function WaveformPreview() {
  return (
    <div className="relative rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
        <span>0:00</span>
        <span className="text-cyan-200">Preview: 15 segundos</span>
        <span>0:30</span>
      </div>
      <div className="relative flex h-48 items-center gap-1 overflow-hidden rounded-lg bg-black/30 px-4">
        <div className="absolute left-[22%] top-0 h-full w-0.5 bg-cyan-300" />
        <div className="absolute left-[64%] top-0 h-full w-0.5 bg-cyan-300" />
        <div className="absolute left-[22%] top-3 rounded-md bg-cyan-300 px-2 py-1 text-xs font-bold text-black">Inicio</div>
        <div className="absolute left-[64%] top-3 rounded-md bg-cyan-300 px-2 py-1 text-xs font-bold text-black">Fin</div>
        {bars.map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="flex-1 rounded-full bg-cyan-300/70"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
