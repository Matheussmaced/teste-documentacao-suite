'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPaymentMethods } from '@/services/api/payments';
import { getToken } from '@/lib/token';
import type { PaymentMethod, InstallmentRule } from '@/types/payments';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

function typeName(type: string) {
  const map: Record<string, string> = {
    pix: 'PIX',
    boleto: 'Boleto',
    credit_card: 'Cartão de Crédito',
  };
  return map[type] ?? type;
}

function RuleRow({ rule }: { rule: InstallmentRule }) {
  return (
    <tr className="border-b border-zinc-800/50 last:border-0">
      <td className="px-3 py-2 text-zinc-300 text-xs">{rule.name}</td>
      <td className="px-3 py-2 text-zinc-400 text-xs">{rule.min_installments}x – {rule.max_installments}x</td>
      <td className="px-3 py-2 text-zinc-400 text-xs">{rule.due_days != null ? `${rule.due_days} dias` : '—'}</td>
      <td className="px-3 py-2 text-zinc-400 text-xs">{rule.interest_rate != null ? `${rule.interest_rate}%` : '—'}</td>
      <td className="px-3 py-2 font-mono text-[11px] text-zinc-500 max-w-[180px]">
        <div className="truncate" title={rule.uuid}>{rule.uuid}</div>
      </td>
    </tr>
  );
}

function MethodCard({ method }: { method: PaymentMethod }) {
  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{method.name}</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {typeName(method.type)}
          </span>
          {!method.active && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              Inativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          {method.is_global && <span>Global</span>}
          {method.generates_closure && <span>Gera fechamento</span>}
        </div>
      </div>

      <p className="text-[11px] text-zinc-600 font-mono mb-3 truncate" title={method.uuid}>{method.uuid}</p>

      {method.installment_rules.length > 0 ? (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/40">
                <th className="text-left px-3 py-2 text-[11px] font-medium text-zinc-500">Regra</th>
                <th className="text-left px-3 py-2 text-[11px] font-medium text-zinc-500">Parcelas</th>
                <th className="text-left px-3 py-2 text-[11px] font-medium text-zinc-500">Vencimento</th>
                <th className="text-left px-3 py-2 text-[11px] font-medium text-zinc-500">Juros</th>
                <th className="text-left px-3 py-2 text-[11px] font-medium text-zinc-500">UUID da regra</th>
              </tr>
            </thead>
            <tbody>
              {method.installment_rules.map((rule) => (
                <RuleRow key={rule.uuid} rule={rule} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-zinc-600">Nenhuma regra de parcelamento configurada.</p>
      )}
    </Card>
  );
}

export default function MetodosPagamentoPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  const fetchMethods = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await getPaymentMethods({ page: p });
      setMethods(result.data);
      setLastPage(result.pagination.last_page);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métodos de pagamento.');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    fetchMethods(page);
  }, [page, hasToken, fetchMethods]);

  if (!hasToken) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-white font-semibold text-xl mb-1">Métodos de Pagamento</h1>
        <p className="text-zinc-500 text-sm mb-6">Métodos disponíveis para confirmar uma venda.</p>
        <Alert variant="warning" title="Autenticação necessária">
          Você precisa autenticar na API InterSuite antes de acessar esta página.{' '}
          <button
            onClick={() => router.push('/dashboard/configuracao')}
            className="underline text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ir para Configuração
          </button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-xl mb-1">Métodos de Pagamento</h1>
        <p className="text-zinc-500 text-sm mb-4">
          Métodos disponíveis para confirmar vendas. O <span className="font-mono text-zinc-400">UUID da regra</span> é o valor a enviar como <span className="font-mono text-zinc-400">payment_method_installment</span> na confirmação.
        </p>
        <EndpointBadge method="GET" path="/payments/methods" visibility="Privado" />
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading && (
        <Card className="p-6">
          <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
        </Card>
      )}

      {!loading && methods.length === 0 && !error && (
        <Card className="p-6">
          <p className="text-zinc-500 text-sm text-center py-8">Nenhum método de pagamento configurado.</p>
        </Card>
      )}

      {!loading && methods.map((m) => <MethodCard key={m.uuid} method={m} />)}

      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">
            Página {page} de {lastPage} · {total} método{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage || loading}
              className="px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
