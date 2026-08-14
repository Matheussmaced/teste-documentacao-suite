'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSales } from '@/services/api/sales';
import { getToken } from '@/lib/token';
import type { Sale } from '@/types/sales';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type Pagination = { current_page: number; last_page: number; per_page: number; total: number };

function saleStatus(sale: Sale): { label: string; color: string } {
  if (sale.downloaded_at) return { label: 'Concluído', color: 'text-green-400' };
  if (sale.issued_at)     return { label: 'Emitido', color: 'text-blue-400' };
  if (sale.paid_at)       return { label: 'Pago', color: 'text-cyan-400' };
  if (sale.confirmed_at)  return { label: 'Confirmado', color: 'text-yellow-400' };
  return                         { label: 'Pendente', color: 'text-zinc-500' };
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function VendasPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => { setHasToken(!!getToken()); }, []);

  const fetchSales = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await getSales({ page: p });
      setSales(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas.');
      setSales([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    fetchSales(page);
  }, [page, hasToken, fetchSales]);

  if (!hasToken) {
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Vendas</h1>
        <p className="text-zinc-500 text-sm mb-6">Lista de vendas de certificado.</p>
        <Alert variant="warning" title="Autenticação necessária">
          Você precisa autenticar na API InterSuite antes de acessar esta página.{' '}
          <button onClick={() => router.push('/dashboard/configuracao')} className="underline text-amber-400 hover:text-amber-300 transition-colors">
            Ir para Configuração
          </button>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white font-semibold text-xl mb-1">Vendas</h1>
        <p className="text-zinc-500 text-sm mb-4">Lista de vendas de certificado digital.</p>
        <div className="flex items-center justify-between">
          <EndpointBadge method="GET" path="/certificate/sales" visibility="Privado" />
          <button
            onClick={() => router.push('/dashboard/vendas/nova')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nova Venda
          </button>
        </div>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Protocolo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 text-sm">Carregando...</td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 text-sm">Nenhuma venda encontrada.</td>
              </tr>
            )}
            {!loading && sales.map((sale) => {
              const status = saleStatus(sale);
              return (
                <tr key={sale.uuid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="text-zinc-200 font-medium truncate" title={sale.client?.holders_name}>
                      {sale.client?.holders_name || '—'}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                      {sale.client?.holders_document || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                    {sale.external_protocol || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        title="Ver detalhe"
                        onClick={() => router.push(`/dashboard/vendas/${sale.uuid}`)}
                        className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Página {pagination.current_page} de {pagination.last_page} · {pagination.total} venda{pagination.total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1 || loading}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page || loading}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
        {pagination && pagination.last_page <= 1 && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{pagination.total} venda{pagination.total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </Card>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
