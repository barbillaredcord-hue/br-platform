type AdminFormFieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
};

export function AdminFormField({ label, placeholder, type = "text" }: AdminFormFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
      />
    </label>
  );
}
