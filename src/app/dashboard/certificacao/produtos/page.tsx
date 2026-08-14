'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProducts } from '@/services/api/products';
import { getToken } from '@/lib/token';
import type { UserProduct, UserProductsListResponse } from '@/types/products';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type Pagination = UserProductsListResponse['pagination'];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  const fetchProducts = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await getUserProducts({ page: p });
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    fetchProducts(page);
  }, [page, hasToken, fetchProducts]);

  if (!hasToken) {
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Produtos</h1>
        <p className="text-zinc-500 text-sm mb-6">Produtos habilitados para venda nesta unidade.</p>
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
    <div>
      <div className="mb-6">
        <h1 className="text-white font-semibold text-xl mb-1">Produtos</h1>
        <p className="text-zinc-500 text-sm mb-4">Produtos habilitados e precificados para venda nesta unidade.</p>
        <EndpointBadge method="GET" path="/certificate/user-products" visibility="Privado" />
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Produto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Provedor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Custo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Preço de Venda</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Editar Preço</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  Nenhum produto habilitado para esta unidade.
                </td>
              </tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p.uuid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-200 font-medium max-w-[200px]">
                  <div className="truncate" title={p.product?.name}>{p.product?.name || '—'}</div>
                  {p.product?.external && (
                    <div className="text-[11px] text-zinc-600 font-mono mt-0.5">{p.product.external}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                    p.product?.kind === 'pf'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {p.product?.kind === 'pf' ? 'e-CPF' : 'e-CNPJ'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 capitalize">{p.product?.provider || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{formatCurrency(p.cost)}</td>
                <td className="px-4 py-3 text-zinc-200 font-mono text-xs font-medium">{formatCurrency(p.sale_price)}</td>
                <td className="px-4 py-3">
                  {p.edit_sale ? (
                    <span className="text-[11px] text-green-400">Sim</span>
                  ) : (
                    <span className="text-[11px] text-zinc-600">Não</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Página {pagination.current_page} de {pagination.last_page} · {pagination.total} produto{pagination.total !== 1 ? 's' : ''}
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
            <span className="text-xs text-zinc-500">
              {pagination.total} produto{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
