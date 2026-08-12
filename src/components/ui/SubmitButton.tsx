interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
}

export function SubmitButton({ label, loadingLabel = 'Autenticando...', loading = false }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
