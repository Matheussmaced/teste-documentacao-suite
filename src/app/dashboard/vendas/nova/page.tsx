'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPersons } from '@/services/api/persons';
import { getUserProducts } from '@/services/api/products';
import { createSale, confirmSale } from '@/services/api/sales';
import { getPaymentMethods } from '@/services/api/payments';
import { getToken } from '@/lib/token';
import type { Person, Pagination } from '@/types/persons';
import type { UserProduct } from '@/types/products';
import type { Sale, Charge } from '@/types/sales';
import type { PaymentMethod } from '@/types/payments';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { GatewayPayload } from '@/components/ui/GatewayPayload';

interface SaleItemDraft {
  product: UserProduct;
  voucher: string;
  coupon: string;
  sale_price: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ChargeRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0 w-44">{label}</span>
      <span className="text-xs text-zinc-300 text-right break-all">{display}</span>
    </div>
  );
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11) return v;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function NovaVendaPage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  // ── Clientes ──────────────────────────────────────────────────────
  const [persons, setPersons] = useState<Person[]>([]);
  const [personPage, setPersonPage] = useState(1);
  const [personPagination, setPersonPagination] = useState<Pagination | null>(null);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [selectedClientUuid, setSelectedClientUuid] = useState('');

  // ── Produtos ──────────────────────────────────────────────────────
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [selectedProductUuid, setSelectedProductUuid] = useState('');
  const [items, setItems] = useState<SaleItemDraft[]>([]);

  // ── Submit ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Sale | null>(null);

  // ── Confirmar ─────────────────────────────────────────────────────
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState('');
  const [installments, setInstallments] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [charge, setCharge] = useState<Charge | null>(null);

  useEffect(() => { setHasToken(!!getToken()); }, []);

  const fetchPersons = useCallback(async (page: number) => {
    setPersonsLoading(true);
    try {
      const result = await getPersons({ page });
      setPersons(result.data);
      setPersonPagination(result.pagination);
    } catch {
      setPersons([]);
    } finally {
      setPersonsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const result = await getUserProducts({ page: 1 });
      setUserProducts(result.data);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
      setUserProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    fetchPersons(personPage);
  }, [hasToken, personPage, fetchPersons]);

  useEffect(() => {
    if (hasToken) fetchProducts();
  }, [hasToken, fetchProducts]);

  useEffect(() => {
    if (!created) return;
    setMethodsLoading(true);
    getPaymentMethods()
      .then((res) => setMethods(res.data))
      .catch((err) => setConfirmError(err instanceof Error ? err.message : 'Erro ao carregar métodos de pagamento.'))
      .finally(() => setMethodsLoading(false));
  }, [created]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!created || !selectedInstallment) return;
    setConfirming(true);
    setConfirmError('');
    try {
      const result = await confirmSale(created.uuid, selectedInstallment, installments);
      setCharge(result.charge);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Erro ao confirmar venda.');
    } finally {
      setConfirming(false);
    }
  }

  function resetAll() {
    setCreated(null);
    setCharge(null);
    setSelectedClientUuid('');
    setItems([]);
    setSelectedInstallment('');
    setInstallments(1);
    setConfirmError('');
    setError('');
  }

  function addItem() {
    if (!selectedProductUuid) return;
    const product = userProducts.find((p) => p.uuid === selectedProductUuid);
    if (!product || items.some((i) => i.product.uuid === selectedProductUuid)) return;
    setItems((prev) => [...prev, { product, voucher: '', coupon: '', sale_price: '' }]);
    setSelectedProductUuid('');
  }

  function removeItem(uuid: string) {
    setItems((prev) => prev.filter((i) => i.product.uuid !== uuid));
  }

  function updateItem(uuid: string, field: keyof Omit<SaleItemDraft, 'product'>, value: string) {
    setItems((prev) => prev.map((i) => i.product.uuid === uuid ? { ...i, [field]: value } : i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientUuid) { setError('Selecione um cliente.'); return; }
    if (items.length === 0) { setError('Adicione ao menos um produto.'); return; }
    setError('');
    setLoading(true);
    try {
      const sale = await createSale({
        client: selectedClientUuid,
        user_product: items.map((i) => ({
          uuid: i.product.uuid,
          ...(i.product.edit_sale && i.sale_price ? { sale_price: parseFloat(i.sale_price) } : {}),
          ...(i.voucher ? { voucher: i.voucher } : {}),
          ...(i.coupon ? { coupon: i.coupon } : {}),
        })),
      });
      setCreated(sale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar venda.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasToken) {
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Nova Venda</h1>
        <p className="text-zinc-500 text-sm mb-6">Cria uma venda de certificado digital.</p>
        <Alert variant="warning" title="Autenticação necessária">
          Você precisa autenticar na API InterSuite antes de acessar esta página.{' '}
          <button onClick={() => router.push('/dashboard/configuracao')} className="underline text-amber-400 hover:text-amber-300 transition-colors">
            Ir para Configuração
          </button>
        </Alert>
      </div>
    );
  }

  if (created) {
    const selectedRule = methods.flatMap((m) => m.installment_rules).find((r) => r.uuid === selectedInstallment);

    if (charge) {
      return (
        <div className="max-w-xl">
          <h1 className="text-white font-semibold text-xl mb-1">Nova Venda</h1>
          <p className="text-zinc-500 text-sm mb-6">Venda confirmada com sucesso.</p>

          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500">Venda confirmada</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                Confirmado
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 shrink-0 w-44">UUID da venda</span>
              <span className="text-xs text-zinc-300 text-right break-all font-mono">{created.uuid}</span>
            </div>
          </Card>

          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500">Cobrança gerada</p>
              <EndpointBadge method="POST" path={`/certificate/sales/${created.uuid}/confirm`} visibility="Autenticado" />
            </div>
            <div className="space-y-0">
              <ChargeRow label="UUID" value={charge.uuid} />
              {charge.description && <ChargeRow label="Descrição" value={charge.description} />}
              <ChargeRow label="Valor" value={Number(charge.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <ChargeRow label="Parcelas" value={charge.installments} />
              <ChargeRow label="Status" value={charge.status} />
              {charge.due_date && <ChargeRow label="Vencimento" value={new Date(charge.due_date).toLocaleDateString('pt-BR')} />}
            </div>
            {charge.response_payload && Object.keys(charge.response_payload).length > 0 && (
              <GatewayPayload payload={charge.response_payload} />
            )}
          </Card>

          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            >
              Nova venda
            </button>
            <button
              onClick={() => router.push(`/dashboard/vendas/${created.uuid}`)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Ver detalhes da venda
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Nova Venda</h1>
        <p className="text-zinc-500 text-sm mb-6">Venda criada. Confirme para gerar a cobrança.</p>

        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500">Venda criada</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-zinc-700 text-zinc-400 border-zinc-600">
              Pendente
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-xs text-zinc-500 shrink-0 w-44">UUID</span>
            <span className="text-xs text-zinc-300 text-right break-all font-mono">{created.uuid}</span>
          </div>
        </Card>

        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500">Confirmar venda</p>
            <EndpointBadge method="POST" path={`/certificate/sales/${created.uuid}/confirm`} visibility="Autenticado" />
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Método de pagamento</label>
              <select
                value={selectedInstallment}
                onChange={(e) => { setSelectedInstallment(e.target.value); setInstallments(1); }}
                disabled={methodsLoading}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2.5 transition-colors disabled:opacity-50"
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
            </div>

            {selectedRule && selectedRule.max_installments > 1 && (
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">Parcelas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={selectedRule.min_installments}
                    max={selectedRule.max_installments}
                    value={installments}
                    onChange={(e) => setInstallments(Math.min(selectedRule.max_installments, Math.max(selectedRule.min_installments, Number(e.target.value))))}
                    className="w-24 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2 transition-colors"
                  />
                  <span className="text-[11px] text-zinc-600">{selectedRule.min_installments}x–{selectedRule.max_installments}x</span>
                </div>
              </div>
            )}

            {confirmError && <p className="text-xs text-red-400">{confirmError}</p>}

            <div className="flex gap-2 pt-1">
              <SubmitButton loading={confirming} label="Confirmar e gerar cobrança" loadingLabel="Confirmando..." />
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  const availableToAdd = userProducts.filter((p) => !items.some((i) => i.product.uuid === p.uuid));

  return (
    <div className="max-w-xl">
      <h1 className="text-white font-semibold text-xl mb-1">Nova Venda</h1>
      <p className="text-zinc-500 text-sm mb-8">Selecione o cliente e os produtos para criar a venda.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Cliente ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500">Cliente</p>
            <EndpointBadge method="POST" path="/certificate/sales" visibility="Autenticado" />
          </div>

          <select
            value={selectedClientUuid}
            onChange={(e) => setSelectedClientUuid(e.target.value)}
            disabled={personsLoading}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-zinc-100 px-3.5 py-2.5 transition-colors disabled:opacity-50"
          >
            <option value="">
              {personsLoading ? 'Carregando clientes...' : 'Selecione um cliente...'}
            </option>
            {persons.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.holders_name} — {formatCPF(p.holders_document)}
              </option>
            ))}
          </select>

          {personPagination && personPagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-zinc-600">
                Página {personPagination.current_page} de {personPagination.last_page}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPersonPage((p) => Math.max(1, p - 1))}
                  disabled={personPagination.current_page <= 1 || personsLoading}
                  className="px-2.5 py-1 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPersonPage((p) => Math.min(personPagination.last_page, p + 1))}
                  disabled={personPagination.current_page >= personPagination.last_page || personsLoading}
                  className="px-2.5 py-1 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Produtos ── */}
        <Card className="p-5">
          <p className="text-xs text-zinc-500 mb-4">Produtos</p>

          {/* Itens adicionados */}
          {items.length > 0 && (
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.product.uuid} className="border border-zinc-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-zinc-200 font-medium">{item.product.product?.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-zinc-500">
                          Custo: <span className="text-zinc-400">{formatCurrency(item.product.cost)}</span>
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Venda: <span className="text-zinc-300 font-medium">{formatCurrency(item.product.sale_price)}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.uuid)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors shrink-0 ml-3"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="space-y-2">
                    {item.product.edit_sale && (
                      <input
                        type="number"
                        placeholder="Preço de venda personalizado (opcional)"
                        value={item.sale_price}
                        onChange={(e) => updateItem(item.product.uuid, 'sale_price', e.target.value)}
                        step="0.01" min="0"
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3 py-2 transition-colors"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Voucher (opcional)"
                      value={item.voucher}
                      onChange={(e) => updateItem(item.product.uuid, 'voucher', e.target.value)}
                      maxLength={255}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3 py-2 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Cupom de desconto (opcional)"
                      value={item.coupon}
                      onChange={(e) => updateItem(item.product.uuid, 'coupon', e.target.value)}
                      maxLength={50}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3 py-2 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar produto */}
          {productsError && (
            <p className="text-xs text-red-400 mb-3">{productsError}</p>
          )}

          {availableToAdd.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={selectedProductUuid}
                onChange={(e) => setSelectedProductUuid(e.target.value)}
                disabled={productsLoading}
                className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2.5 transition-colors disabled:opacity-50"
              >
                <option value="">
                  {productsLoading ? 'Carregando produtos...' : 'Selecionar produto...'}
                </option>
                {availableToAdd.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.product?.name} — custo {formatCurrency(p.cost)} / venda {formatCurrency(p.sale_price)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addItem}
                disabled={!selectedProductUuid}
                className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                Adicionar
              </button>
            </div>
          ) : productsLoading ? (
            <p className="text-xs text-zinc-500">Carregando produtos...</p>
          ) : items.length > 0 ? (
            <p className="text-xs text-zinc-600">Todos os produtos disponíveis foram adicionados.</p>
          ) : (
            <p className="text-xs text-zinc-500">Nenhum produto disponível para venda.</p>
          )}
        </Card>

        {error && <Alert variant="error">{error}</Alert>}
        <SubmitButton loading={loading} label="Criar Venda" loadingLabel="Criando..." />
      </form>
    </div>
  );
}
