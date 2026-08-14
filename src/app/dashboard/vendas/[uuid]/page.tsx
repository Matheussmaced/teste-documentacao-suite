'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSale, updateSaleClient, confirmSale } from '@/services/api/sales';
import { getPersons } from '@/services/api/persons';
import { getPaymentMethods } from '@/services/api/payments';
import type { PaymentMethod } from '@/types/payments';
import type { SaleDetail } from '@/types/sales';
import type { Person, Pagination } from '@/types/persons';
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
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMethodsLoading(true);
    getPaymentMethods()
      .then((res) => setMethods(res.data.filter((m) => m.active && m.installment_rules.length > 0)))
      .catch(() => setMethods([]))
      .finally(() => setMethodsLoading(false));
  }, [open]);

  async function handleConfirm() {
    if (!selectedInstallment) return;
    setConfirming(true);
    setError('');
    try {
      const updated = await confirmSale(saleUuid, selectedInstallment);
      onSuccess(updated);
      setOpen(false);
      setSelectedInstallment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar venda.');
    } finally {
      setConfirming(false);
    }
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
        <p className="text-xs text-zinc-400 font-medium">Selecionar método de pagamento</p>
        <EndpointBadge method="POST" path={`/certificate/sales/${saleUuid}/confirm`} visibility="Autenticado" />
      </div>

      <select
        value={selectedInstallment}
        onChange={(e) => setSelectedInstallment(e.target.value)}
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
          onClick={() => { setOpen(false); setSelectedInstallment(''); setError(''); }}
          disabled={confirming}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
        >
          Cancelar
        </button>
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

          <ArrayCard title="Cobranças" items={sale.charges} />
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
