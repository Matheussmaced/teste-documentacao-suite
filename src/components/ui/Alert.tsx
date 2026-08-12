type AlertVariant = 'success' | 'warning' | 'error' | 'info';

const styles: Record<AlertVariant, { wrapper: string; title: string; body: string }> = {
  success: {
    wrapper: 'bg-green-500/5 border-green-500/20',
    title: 'text-green-400',
    body: 'text-green-700',
  },
  warning: {
    wrapper: 'bg-amber-500/5 border-amber-500/20',
    title: 'text-amber-400',
    body: 'text-amber-500',
  },
  error: {
    wrapper: 'bg-red-500/10 border-red-500/20',
    title: 'text-red-400',
    body: 'text-red-500',
  },
  info: {
    wrapper: 'bg-zinc-800/50 border-zinc-700/50',
    title: 'text-zinc-300',
    body: 'text-zinc-400',
  },
};

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant, title, children, className = '' }: AlertProps) {
  const s = styles[variant];
  return (
    <div className={`rounded-lg border px-4 py-3 ${s.wrapper} ${className}`}>
      {title && <p className={`text-sm font-medium ${s.title}`}>{title}</p>}
      <div className={`text-xs leading-relaxed mt-0.5 ${s.body}`}>{children}</div>
    </div>
  );
}
