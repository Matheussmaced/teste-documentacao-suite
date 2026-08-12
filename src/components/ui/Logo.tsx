interface LogoProps {
  size?: 'sm' | 'md';
  subtitle?: string;
}

export function Logo({ size = 'md', subtitle }: LogoProps) {
  const badge = size === 'sm'
    ? 'w-6 h-6 text-[10px]'
    : 'w-7 h-7 text-xs';

  const text = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div>
      <span className={`inline-flex items-center gap-2 text-white font-semibold tracking-tight ${text}`}>
        <span className={`rounded-md bg-blue-500 flex items-center justify-center font-bold ${badge}`}>
          IS
        </span>
        InterSuite
      </span>
      {subtitle && (
        <p className="text-[10px] text-zinc-500 mt-0.5 tracking-widest uppercase">{subtitle}</p>
      )}
    </div>
  );
}
