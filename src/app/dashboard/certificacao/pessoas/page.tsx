'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPersons } from '@/services/api/persons';
import { getToken } from '@/lib/token';
import type { Person, Pagination } from '@/types/persons';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export default function PessoasPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  const fetchPersons = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError('');
    try {
      const params: { search?: string; page?: number } = { page: p };
      if (q.trim()) params.search = q.trim();
      const result = await getPersons(params);
      setPersons(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pessoas.');
      setPersons([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPersons(search, 1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, hasToken, fetchPersons]);

  useEffect(() => {
    if (!hasToken) return;
    fetchPersons(search, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (!hasToken) {
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Pessoas</h1>
        <p className="text-zinc-500 text-sm mb-6">Lista de pessoas cadastradas no InterSuite.</p>
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
        <h1 className="text-white font-semibold text-xl mb-1">Pessoas</h1>
        <p className="text-zinc-500 text-sm mb-4">Lista de pessoas cadastradas no InterSuite.</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por nome, CPF, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <EndpointBadge method="GET" path="/persons" visibility="Privado" />
          </div>
          <Link
            href="/dashboard/certificacao/pessoas/novo"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Cadastrar
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">CPF</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Empresa</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">CNPJ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cidade / UF</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">E-mail</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && persons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  {search ? 'Nenhum resultado para a busca.' : 'Nenhuma pessoa cadastrada.'}
                </td>
              </tr>
            )}
            {!loading && persons.map((p) => (
              <tr key={p.uuid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-200 font-medium max-w-[160px]">
                  <div className="truncate" title={p.holders_name}>{p.holders_name || '—'}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                  {p.holders_document ? formatCPF(p.holders_document) : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400 max-w-[150px]">
                  <div className="truncate" title={p.fantasy_name}>{p.fantasy_name || '—'}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                  {p.document ? formatCNPJ(p.document) : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                  {p.address_city && p.address_uf ? `${p.address_city} / ${p.address_uf}` : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400 max-w-[160px]">
                  <div className="truncate" title={p.email}>{p.email || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="Editar"
                      className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Excluir"
                      className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Página {pagination.current_page} de {pagination.last_page} · {pagination.total} registro{pagination.total !== 1 ? 's' : ''}
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
              {pagination.total} registro{pagination.total !== 1 ? 's' : ''}
            </span>
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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
