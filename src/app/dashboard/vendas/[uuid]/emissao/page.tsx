'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSale } from '@/services/api/sales';
import { discoverBirdId } from '@/services/api/soluti';
import type { SaleDetail } from '@/types/sales';
import type { BirdIdSlot } from '@/types/soluti';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type Path = 'birdid' | 'webservice' | null;

function formatDocument(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}

export default function EmissaoPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [saleLoading, setSaleLoading] = useState(true);
  const [saleError, setSaleError] = useState('');

  // ── Discovery ────────────────────────────────────────────────────
  const [document, setDocument] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [slots, setSlots] = useState<BirdIdSlot[] | null>(null);
  const [path, setPath] = useState<Path>(null);

  useEffect(() => {
    getSale(uuid)
      .then((s) => {
        setSale(s);
        if (s.client?.holders_document) setDocument(s.client.holders_document);
      })
      .catch((err) => setSaleError(err instanceof Error ? err.message : 'Erro ao carregar venda.'))
      .finally(() => setSaleLoading(false));
  }, [uuid]);

  async function handleDiscovery(e: React.FormEvent) {
    e.preventDefault();
    if (!document.trim()) return;
    setDiscovering(true);
    setDiscoveryError('');
    setSlots(null);
    setPath(null);
    try {
      const result = await discoverBirdId(document.replace(/\D/g, ''));
      if (result !== null) {
        setSlots(result);
        setPath('birdid');
      } else {
        setSlots(null);
        setPath('webservice');
      }
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : 'Erro ao verificar Bird ID.');
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Voltar">
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="text-white font-semibold text-xl">Emissão</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-8 ml-7">
        {saleLoading ? 'Carregando...' : sale ? (sale.client?.holders_name ?? uuid) : 'Venda não encontrada'}
      </p>

      {saleError && <Alert variant="error" className="mb-6">{saleError}</Alert>}

      {/* ── Step 1: Discovery ── */}
      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Passo 1</p>
            <p className="text-sm text-zinc-200 font-medium">Verificar Bird ID</p>
          </div>
          <EndpointBadge method="GET" path="/soluti/birdid/discovery/{document}" visibility="Autenticado" />
        </div>

        <p className="text-[11px] text-zinc-600 mb-4">
          Consulta no VaultId/Soluti se o documento já possui um certificado Bird ID.
          200 com dados → Caminho A. 404 → Caminho B (WebService).
        </p>

        <form onSubmit={handleDiscovery} className="space-y-3">
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1.5">CPF / CNPJ do titular</label>
            <input
              type="text"
              value={document}
              onChange={(e) => { setDocument(e.target.value); setPath(null); setSlots(null); }}
              placeholder="000.000.000-00"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
            />
          </div>

          {discoveryError && <p className="text-xs text-red-400">{discoveryError}</p>}

          <button
            type="submit"
            disabled={discovering || !document.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {discovering ? 'Verificando...' : 'Verificar Bird ID'}
          </button>
        </form>

        {/* Resultado */}
        {path === 'birdid' && slots !== null && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                Caminho A — Bird ID
              </span>
              <span className="text-[11px] text-zinc-600">{slots.length} slot{slots.length !== 1 ? 's' : ''} encontrado{slots.length !== 1 ? 's' : ''}</span>
            </div>
            {slots.length > 0 && (
              <div className="space-y-2">
                {slots.map((slot, idx) => (
                  <div key={idx} className="bg-zinc-800/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-zinc-300 font-medium">{slot.label}</p>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5">{slot.slot_alias}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-zinc-500 mt-3">Siga para o agendamento (próximo passo).</p>
          </div>
        )}

        {path === 'webservice' && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                Caminho B — WebService
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Documento não possui Bird ID. Siga para a emissão via WebService (próximo passo).
            </p>
          </div>
        )}
      </Card>

      {/* Próximos passos — serão adicionados conforme endpoints chegarem */}
      {path !== null && (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-600">Próximos passos em implementação...</p>
        </div>
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
