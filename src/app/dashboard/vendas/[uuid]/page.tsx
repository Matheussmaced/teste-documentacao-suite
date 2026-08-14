'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSale, updateSaleClient, confirmSale } from '@/services/api/sales';
import { getPersons } from '@/services/api/persons';
import { getPaymentMethods } from '@/services/api/payments';
import type { PaymentMethod } from '@/types/payments';
import type { SaleDetail, Charge } from '@/types/sales';
import type { Person, Pagination } from '@/types/persons';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';
import { GatewayPayload } from '@/components/ui/GatewayPayload';

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

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function saleStatus(sale: SaleDetail) {
  if (sale.downloaded_at) return { label: 'Concluído',  color: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (sale.issued_at)     return { label: 'Emitido',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (sale.paid_at)       return { label: 'Pago',       color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
  if (sale.confirmed_at)  return { label: 'Confirmado', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  return                         { label: 'Pendente',   color: 'bg-zinc-700 text-zinc-400 border-zinc-600' };
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11) return v;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function ArrayCard({ title, items }: { title: string; items: Record<string, unknown>[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="p-6 mb-4">
      <p className="text-xs text-zinc-500 mb-3">{title} <span className="ml-1 text-zinc-600">({items.length})</span></p>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 text-xs font-mono text-zinc-400 break-all whitespace-pre-wrap">
            {JSON.stringify(item, null, 2)}
          </div>
        ))}
      </div>
    </Card>
  );
}

function CobrancasCard({ charges }: { charges: Record<string, unknown>[] }) {
  if (charges.length === 0) return null;
  return (
    <Card className="overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-zinc-800">
        <p className="text-xs text-zinc-500">Cobranças <span className="ml-1 text-zinc-600">({charges.length})</span></p>
      </div>
      <div className="divide-y divide-zinc-800">
        {charges.map((c, idx) => {
          const uuid = typeof c.uuid === 'string' ? c.uuid : null;
          const description = typeof c.description === 'string' ? c.description : null;
          const amount = typeof c.amount === 'number' ? c.amount : null;
          const status = typeof c.status === 'string' ? c.status : null;
          return (
            <div key={uuid ?? idx} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-800/30 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-300 truncate">{description ?? uuid ?? `Cobrança ${idx + 1}`}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {amount !== null && (
                    <span className="text-[11px] text-zinc-500">
                      {Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  {status && (
                    <span className="text-[11px] text-zinc-600">{status}</span>
                  )}
                </div>
              </div>
              {uuid && (
                <Link
                  href={`/dashboard/vendas/cobrancas/${uuid}`}
                  className="ml-4 shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Ver cobrança"
                >
                  <EyeIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TrocarClientePanel({ saleUuid, onSuccess }: { saleUuid: string; onSuccess: (sale: SaleDetail) => void }) {
  const [open, setOpen] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [personPage, setPersonPage] = useState(1);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPersons = useCallback(async (p: number) => {
    setPersonsLoading(true);
    try {
      const result = await getPersons({ page: p });
      setPersons(result.data);
      setPagination(result.pagination);
    } catch {
      setPersons([]);
    } finally {
      setPersonsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchPersons(personPage);
  }, [open, personPage, fetchPersons]);

  async function handleSave() {
    if (!selectedUuid) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateSaleClient(saleUuid, selectedUuid) as unknown as SaleDetail;
      onSuccess({ ...updated, charges: [], appointments: [], certificate_renewals: [], soluti_emit_data: [] });
      setOpen(false);
      setSelectedUuid('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar cliente.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        Trocar cliente
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400 font-medium">Selecionar novo cliente</p>
        <EndpointBadge method="PATCH" path={`/certificate/sales/${saleUuid}`} visibility="Autenticado" />
      </div>

      <select
        value={selectedUuid}
        onChange={(e) => setSelectedUuid(e.target.value)}
        disabled={personsLoading}
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2.5 transition-colors disabled:opacity-50 mb-2"
      >
        <option value="">{personsLoading ? 'Carregando...' : 'Selecione um cliente...'}</option>
        {persons.map((p) => (
          <option key={p.uuid} value={p.uuid}>
            {p.holders_name} — {formatCPF(p.holders_document)}
          </option>
        ))}
      </select>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-zinc-600">Página {pagination.current_page} de {pagination.last_page}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPersonPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1 || personsLoading}
              className="px-2.5 py-1 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <button type="button" onClick={() => setPersonPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page >= pagination.last_page || personsLoading}
              className="px-2.5 py-1 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Próxima
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!selectedUuid || saving}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Salvando...' : 'Confirmar troca'}
        </button>
        <button
          onClick={() => { setOpen(false); setSelectedUuid(''); setError(''); }}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ConfirmarVendaPanel({ saleUuid, onSuccess }: { saleUuid: string; onSuccess: (sale: SaleDetail) => void }) {
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState('');
  const [installments, setInstallments] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [charge, setCharge] = useState<Charge | null>(null);

  useEffect(() => {
    if (!open) return;
    setMethodsLoading(true);
    getPaymentMethods()
      .then((res) => setMethods(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar métodos de pagamento.'))
      .finally(() => setMethodsLoading(false));
  }, [open]);

  const selectedRule = methods.flatMap((m) => m.installment_rules).find((r) => r.uuid === selectedInstallment);

  async function handleConfirm() {
    if (!selectedInstallment) return;
    setConfirming(true);
    setError('');
    try {
      const result = await confirmSale(saleUuid, selectedInstallment, installments);
      setCharge(result.charge);
      onSuccess({ ...result.sale, charges: [], appointments: [], certificate_renewals: [], soluti_emit_data: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar venda.');
    } finally {
      setConfirming(false);
    }
  }

  if (charge) {
    return (
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-xs text-green-400 font-medium mb-3">Venda confirmada — cobrança gerada</p>
        <ChargeCard charge={charge} />
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-green-400 hover:text-green-300 transition-colors"
      >
        Confirmar venda
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400 font-medium">Confirmar venda</p>
        <EndpointBadge method="POST" path={`/certificate/sales/${saleUuid}/confirm`} visibility="Autenticado" />
      </div>

      <select
        value={selectedInstallment}
        onChange={(e) => { setSelectedInstallment(e.target.value); setInstallments(1); }}
        disabled={methodsLoading}
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2.5 transition-colors disabled:opacity-50 mb-2"
      >
        <option value="">{methodsLoading ? 'Carregando...' : 'Selecione um método de pagamento...'}</option>
        {methods.map((method) =>
          method.installment_rules.map((rule) => (
            <option key={rule.uuid} value={rule.uuid}>
              {method.name} — {rule.name}
              {rule.min_installments !== rule.max_installments
                ? ` (${rule.min_installments}x–${rule.max_installments}x)`
                : ` (${rule.min_installments}x)`}
            </option>
          ))
        )}
      </select>

      {selectedRule && selectedRule.max_installments > 1 && (
        <div className="mb-2">
          <label className="text-[11px] text-zinc-500 block mb-1">Parcelas</label>
          <input
            type="number"
            min={selectedRule.min_installments}
            max={selectedRule.max_installments}
            value={installments}
            onChange={(e) => setInstallments(Math.min(selectedRule.max_installments, Math.max(selectedRule.min_installments, Number(e.target.value))))}
            className="w-24 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2 transition-colors"
          />
          <span className="text-[11px] text-zinc-600 ml-2">{selectedRule.min_installments}x–{selectedRule.max_installments}x</span>
        </div>
      )}

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedInstallment || confirming}
          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {confirming ? 'Confirmando...' : 'Confirmar venda'}
        </button>
        <button
          onClick={() => { setOpen(false); setSelectedInstallment(''); setError(''); setInstallments(1); }}
          disabled={confirming}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ChargeCard({ charge }: { charge: Charge }) {
  return (
    <div className="space-y-1.5">
      <Row label="UUID" value={charge.uuid} />
      {charge.description && <Row label="Descrição" value={charge.description} />}
      <Row label="Valor" value={Number(charge.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
      <Row label="Parcelas" value={charge.installments} />
      <Row label="Status" value={charge.status} />
      {charge.due_date && <Row label="Vencimento" value={new Date(charge.due_date).toLocaleDateString('pt-BR')} />}
      {charge.response_payload && Object.keys(charge.response_payload).length > 0 && (
        <GatewayPayload payload={charge.response_payload} />
      )}
      <div className="pt-2">
        <Link
          href={`/dashboard/vendas/cobrancas/${charge.uuid}`}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Ver detalhe da cobrança →
        </Link>
      </div>
    </div>
  );
}

export default function DetalheVendaPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSale(uuid)
      .then(setSale)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venda.'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const status = sale ? saleStatus(sale) : null;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Voltar">
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="text-white font-semibold text-xl">Detalhe da Venda</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-8 ml-7">
        {loading ? 'Carregando...' : sale ? sale.client?.holders_name ?? uuid : 'Venda não encontrada'}
      </p>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}
      {loading && <Card className="p-6"><div className="text-zinc-500 text-sm text-center py-8">Carregando...</div></Card>}

      {!loading && sale && (
        <>
          {/* Venda */}
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <EndpointBadge method="GET" path={`/certificate/sales/${uuid}`} visibility="Autenticado" />
              {status && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mb-2">Venda</p>
            <Row label="UUID" value={sale.uuid} />
            <Row label="Protocolo externo" value={sale.external_protocol} />
            <Row label="Confirmado em" value={formatDate(sale.confirmed_at)} />
            <Row label="Pago em" value={formatDate(sale.paid_at)} />
            <Row label="Emitido em" value={formatDate(sale.issued_at)} />
            <Row label="Baixado em" value={formatDate(sale.downloaded_at)} />
            <Row label="Criado em" value={formatDate(sale.created_at)} />
            <Row label="Atualizado em" value={formatDate(sale.updated_at)} />
          </Card>

          {/* Cliente */}
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500">Cliente</p>
              {!sale.confirmed_at && (
                <div className="flex items-center gap-3">
                  <TrocarClientePanel saleUuid={sale.uuid} onSuccess={setSale} />
                  <ConfirmarVendaPanel saleUuid={sale.uuid} onSuccess={setSale} />
                </div>
              )}
            </div>
            <Row label="Nome" value={sale.client?.holders_name} />
            <Row label="CPF" value={sale.client?.holders_document} />
            <Row label="E-mail" value={sale.client?.email} />
          </Card>

          {/* Vendedor */}
          <Card className="p-6 mb-4">
            <p className="text-xs text-zinc-500 mb-2">Vendedor</p>
            <Row label="Nome" value={sale.seller?.name ? `${sale.seller.name} ${sale.seller.last_name ?? ''}`.trim() : undefined} />
            <Row label="E-mail" value={sale.seller?.email} />
          </Card>

          {/* Itens */}
          {sale.items.length > 0 && (
            <Card className="p-6 mb-4">
              <p className="text-xs text-zinc-500 mb-3">Itens <span className="ml-1 text-zinc-600">({sale.items.length})</span></p>
              <div className="space-y-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-xs text-zinc-400 font-mono truncate max-w-[260px]">
                      {typeof item.user_product === 'string' ? item.user_product : JSON.stringify(item.user_product)}
                    </span>
                    <div className="flex gap-3 shrink-0 ml-3">
                      {item.cost != null && (
                        <span className="text-xs text-zinc-500">
                          Custo: <span className="text-zinc-400">{Number(item.cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </span>
                      )}
                      {item.sale_price != null && (
                        <span className="text-xs text-zinc-500">
                          Venda: <span className="text-zinc-300 font-medium">{Number(item.sale_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <CobrancasCard charges={sale.charges} />
          <ArrayCard title="Agendamentos" items={sale.appointments} />
          <ArrayCard title="Renovações" items={sale.certificate_renewals} />
          <ArrayCard title="Emissões Soluti" items={sale.soluti_emit_data} />
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
