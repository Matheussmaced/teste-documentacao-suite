'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCharge } from '@/services/api/charges';
import type { Charge } from '@/types/sales';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';
import { GatewayPayload } from '@/components/ui/GatewayPayload';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0 w-44">{label}</span>
      <span className="text-xs text-zinc-300 text-right break-all">{display}</span>
    </div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'pago':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'pending':
    case 'pendente':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'cancelled':
    case 'canceled':
    case 'cancelado':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-zinc-700 text-zinc-400 border-zinc-600';
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    paid: 'Pago',
    pago: 'Pago',
    pending: 'Pendente',
    pendente: 'Pendente',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
    cancelado: 'Cancelado',
  };
  return map[status.toLowerCase()] ?? status;
}

export default function DetalheCobrancaPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [charge, setCharge] = useState<Charge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCharge(uuid)
      .then(setCharge)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar cobrança.'))
      .finally(() => setLoading(false));
  }, [uuid]);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Voltar">
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="text-white font-semibold text-xl">Detalhe da Cobrança</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-8 ml-7">
        {loading ? 'Carregando...' : charge ? (charge.description ?? uuid) : 'Cobrança não encontrada'}
      </p>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}
      {loading && <Card className="p-6"><div className="text-zinc-500 text-sm text-center py-8">Carregando...</div></Card>}

      {!loading && charge && (
        <>
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <EndpointBadge method="GET" path={`/charges/${uuid}`} visibility="Autenticado" />
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusBadge(charge.status)}`}>
                {statusLabel(charge.status)}
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-2">Cobrança</p>
            <Row label="UUID" value={charge.uuid} />
            {charge.description && <Row label="Descrição" value={charge.description} />}
            <Row label="Valor" value={Number(charge.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <Row label="Parcelas" value={charge.installments} />
            <Row label="Vencimento" value={formatDate(charge.due_date)} />
            {charge.payment_date && <Row label="Data de pagamento" value={formatDate(charge.payment_date)} />}
            <Row label="Criado em" value={formatDate(charge.created_at)} />
            <Row label="Atualizado em" value={formatDate(charge.updated_at)} />
          </Card>

          <Card className="p-6 mb-4">
            <p className="text-xs text-zinc-500 mb-2">Origem</p>
            <Row label="Tipo" value={charge.source_type} />
            <Row label="UUID da origem" value={charge.source_uuid} />
            {charge.source_type === 'certificate_sales' && (
              <div className="pt-2">
                <button
                  onClick={() => router.push(`/dashboard/vendas/${charge.source_uuid}`)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Ver venda →
                </button>
              </div>
            )}
          </Card>

          {charge.response_payload && Object.keys(charge.response_payload).length > 0 && (
            <Card className="p-6 mb-4">
              <p className="text-xs text-zinc-500 mb-2">Pagamento</p>
              <GatewayPayload payload={charge.response_payload} />
            </Card>
          )}
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
