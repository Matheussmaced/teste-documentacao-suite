'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSalesDashboard } from '@/services/api/sales';
import { getToken } from '@/lib/token';
import type { SalesDashboardData } from '@/types/sales';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-36 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] text-zinc-500">{d.value > 0 ? d.value : ''}</span>
          <div className="w-full flex items-end" style={{ height: '96px' }}>
            <div
              className="w-full rounded-t bg-blue-500/70 hover:bg-blue-500 transition-colors"
              style={{ height: `${Math.max((d.value / max) * 96, d.value > 0 ? 4 : 0)}px` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] text-zinc-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardVendasPage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { setHasToken(!!getToken()); }, []);

  const fetchDashboard = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getSalesDashboard({
        ...(start ? { start_date: start } : {}),
        ...(end ? { end_date: end } : {}),
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasToken) fetchDashboard();
  }, [hasToken, fetchDashboard]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchDashboard(startDate, endDate);
  }

  function handleClear() {
    setStartDate('');
    setEndDate('');
    fetchDashboard();
  }

  if (!hasToken) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-white font-semibold text-xl mb-1">Dashboard de Vendas</h1>
        <p className="text-zinc-500 text-sm mb-6">Métricas de performance de vendas.</p>
        <Alert variant="warning" title="Autenticação necessária">
          Você precisa autenticar na API InterSuite antes de acessar esta página.{' '}
          <button onClick={() => router.push('/dashboard/configuracao')} className="underline text-amber-400 hover:text-amber-300 transition-colors">
            Ir para Configuração
          </button>
        </Alert>
      </div>
    );
  }

  const chartData = (data?.monthlySales ?? []).map((m) => ({ label: m.month, value: m.sales }));
  const totalTeam = data?.teamPerformance.reduce((acc, m) => acc + m.certificatesIssued, 0) ?? 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-white font-semibold text-xl mb-1">Dashboard de Vendas</h1>
        <p className="text-zinc-500 text-sm mb-4">Métricas de performance de vendas da equipe.</p>
        <EndpointBadge method="GET" path="/certificate/sales/dashboard" visibility="Privado" />
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-5">
        <form onSubmit={handleFilter} className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Data início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Data fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3 py-2 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50 transition-colors"
          >
            Filtrar
          </button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
            >
              Limpar
            </button>
          )}
        </form>
      </Card>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading && (
        <Card className="p-6">
          <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
        </Card>
      )}

      {!loading && data && (
        <>
          {/* Gráfico mensal */}
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-zinc-500">Vendas mensais</p>
              <span className="text-[11px] text-zinc-600">Últimos 12 meses</span>
            </div>
            {chartData.length > 0 ? (
              <BarChart data={chartData} />
            ) : (
              <p className="text-xs text-zinc-600 text-center py-8">Sem dados de vendas mensais.</p>
            )}
          </Card>

          {/* Performance da equipe */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <p className="text-xs text-zinc-500">Performance da equipe</p>
              <span className="text-[11px] text-zinc-600">{totalTeam} certificado{totalTeam !== 1 ? 's' : ''} emitido{totalTeam !== 1 ? 's' : ''}</span>
            </div>
            {data.teamPerformance.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-8">Sem dados de equipe.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Membro</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Certificados emitidos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamPerformance
                    .slice()
                    .sort((a, b) => b.certificatesIssued - a.certificatesIssued)
                    .map((member) => (
                      <tr
                        key={member.uuid}
                        className={`border-b border-zinc-800/50 last:border-0 ${member.isCurrentUser ? 'bg-blue-500/5' : 'hover:bg-zinc-800/30'} transition-colors`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-200 text-sm">{member.name}</span>
                            {member.isCurrentUser && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Você
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-zinc-200 font-medium text-sm">{member.certificatesIssued}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
