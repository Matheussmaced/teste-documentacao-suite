'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserProduct } from '@/services/api/products';
import type { UserProduct } from '@/types/products';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display =
    value === null || value === undefined || value === ''
      ? '—'
      : typeof value === 'boolean'
      ? value ? 'Sim' : 'Não'
      : String(value);

  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0 w-44">{label}</span>
      <span className="text-xs text-zinc-300 text-right break-all">{display}</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DetalheUserProductPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [product, setProduct] = useState<UserProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserProduct(uuid)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar produto.'))
      .finally(() => setLoading(false));
  }, [uuid]);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Voltar"
        >
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="text-white font-semibold text-xl">Detalhe do Produto</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-8 ml-7">
        {loading ? 'Carregando...' : product ? product.product?.name ?? uuid : 'Produto não encontrado'}
      </p>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading && (
        <Card className="p-6">
          <div className="text-zinc-500 text-sm text-center py-8">Carregando...</div>
        </Card>
      )}

      {!loading && product && (
        <>
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <EndpointBadge method="GET" path={`/certificate/user-products/${uuid}`} visibility="Autenticado" />
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                product.product?.kind === 'pf'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}>
                {product.product?.kind === 'pf' ? 'e-CPF' : 'e-CNPJ'}
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-2">Produto</p>
            <Row label="Nome" value={product.product?.name} />
            <Row label="Descrição" value={product.product?.description} />
            <Row label="Código PID (SISCD)" value={product.product?.external} />
            <Row label="Provedor" value={product.product?.provider} />
            <Row label="Ativo" value={product.product?.active} />
          </Card>

          <Card className="p-6 mb-4">
            <p className="text-xs text-zinc-500 mb-2">Precificação</p>
            <Row label="Custo" value={formatCurrency(product.cost)} />
            <Row label="Preço de Venda" value={formatCurrency(product.sale_price)} />
            <Row label="Custo Sugerido" value={formatCurrency(product.suggested_cost)} />
            <Row label="Preço Sugerido" value={formatCurrency(product.suggested_sale_price)} />
            <Row label="Permite editar preço" value={product.edit_sale} />
            <Row label="Visível para operador" value={product.show} />
          </Card>

          <Card className="p-6">
            <p className="text-xs text-zinc-500 mb-2">Metadados</p>
            <Row label="uuid" value={product.uuid} />
            <Row label="user_uuid" value={product.user_uuid} />
            <Row label="product_uuid" value={product.product_uuid} />
            <Row label="created_at" value={product.created_at} />
            <Row label="updated_at" value={product.updated_at} />
          </Card>
        </>
      )}
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}
