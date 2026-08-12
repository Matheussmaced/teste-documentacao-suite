interface FieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hint?: string;
  tag?: string;
  mono?: boolean;
}

export function Field({ label, name, type, placeholder, value, onChange, required, hint, tag, mono = false }: FieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label
          htmlFor={name}
          className={`text-xs font-medium text-zinc-300 ${mono ? 'font-mono' : ''}`}
        >
          {label}
        </label>
        {tag && <span className="text-[10px] text-zinc-600">{tag}</span>}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}
