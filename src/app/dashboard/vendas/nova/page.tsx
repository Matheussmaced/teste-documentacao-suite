'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPersons } from '@/services/api/persons';
import { getUserProducts } from '@/services/api/products';
import { createSale } from '@/services/api/sales';
import { getToken } from '@/lib/token';
import type { Person, Pagination } from '@/types/persons';
import type { UserProduct } from '@/types/products';
import type { Sale } from '@/types/sales';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';
import { SubmitButton } from '@/components/ui/SubmitButton';

interface SaleItemDraft {
  product: UserProduct;
  voucher: string;
  coupon: string;
  sale_price: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Nova Venda</h1>
        <Alert variant="success" title="Venda criada com sucesso" className="mt-6">
          <p className="font-mono text-xs">{created.uuid}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => { setCreated(null); setSelectedClientUuid(''); setItems([]); }}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Nova venda
            </button>
          </div>
        </Alert>
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
