const adminItems = ["Panel Admin", "Subir Beat", "Editor de Preview"];

export function AdminPreview() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <h2 className="mb-4 text-xl font-bold">Admin preview</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {adminItems.map((item) => (
          <a
            key={item}
            href="#"
            className="rounded-md border border-cyan-300/20 bg-white/5 px-4 py-4 text-sm font-semibold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
          >
            {item}
          </a>
        ))}
      </div>
    </section>
  );
}
