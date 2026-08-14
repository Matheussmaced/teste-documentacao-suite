'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSale } from '@/services/api/sales';
import { discoverBirdId, scheduleStart, validateWebServiceEmit } from '@/services/api/soluti';
import type { SaleDetail } from '@/types/sales';
import type { BirdIdSlot, ScheduleStartData, WebServiceEmissao } from '@/types/soluti';
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

  // ── Schedule Start (Caminho A) ───────────────────────────────────
  const [aceite, setAceite] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [startData, setStartData] = useState<ScheduleStartData | null>(null);

  // ── Validate (Caminho B) ─────────────────────────────────────────
  const [solicitationCode, setSolicitationCode] = useState('');
  const [emitPassword, setEmitPassword] = useState('');
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState('');
  const [emissao, setEmissao] = useState<WebServiceEmissao | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getSale(uuid)
      .then((s) => {
        setSale(s);
        if (s.client?.holders_document) setDocument(s.client.holders_document);
        if (s.external_protocol) setSolicitationCode(s.external_protocol);
      })
      .catch((err) => setSaleError(err instanceof Error ? err.message : 'Erro ao carregar venda.'))
      .finally(() => setSaleLoading(false));
  }, [uuid]);

  function startCooldown() {
    setCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!solicitationCode.trim() || !aceite) return;
    setStarting(true);
    setStartError('');
    setStartData(null);
    try {
      const result = await scheduleStart(solicitationCode.trim(), aceite);
      setStartData(result);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Erro ao iniciar agendamento.');
    } finally {
      setStarting(false);
    }
  }

  const handleValidate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!solicitationCode.trim() || !emitPassword.trim()) return;
    setValidating(true);
    setValidateError('');
    try {
      const result = await validateWebServiceEmit(solicitationCode.trim(), emitPassword.trim());
      setEmissao(result);
      if (result.status !== 2 && result.status !== 8 && result.status !== 9) startCooldown();
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : 'Erro ao validar emissão.');
    } finally {
      setValidating(false);
    }
  }, [solicitationCode, emitPassword]);

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

      {/* ── Step 2: Caminho B — Validate ── */}
      {path === 'webservice' && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 2 — Caminho B</p>
              <p className="text-sm text-zinc-200 font-medium">Validar dados da emissão</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/webservice/emit/validate" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Use antes de chamar a emissão e para monitorar o status. Aguarde 30s entre cada consulta.
          </p>

          <form onSubmit={handleValidate} className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Código da solicitação (external_protocol)</label>
              <input
                type="text"
                value={solicitationCode}
                onChange={(e) => setSolicitationCode(e.target.value)}
                placeholder="Protocolo externo da venda"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Senha de emissão</label>
              <input
                type="password"
                value={emitPassword}
                onChange={(e) => setEmitPassword(e.target.value)}
                placeholder="Senha de emissão do certificado"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
              />
            </div>

            {validateError && <p className="text-xs text-red-400">{validateError}</p>}

            <button
              type="submit"
              disabled={validating || !solicitationCode.trim() || !emitPassword.trim() || cooldown > 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {validating ? 'Validando...' : cooldown > 0 ? `Aguarde ${cooldown}s...` : emissao ? 'Verificar novamente' : 'Validar'}
            </button>
          </form>

          {emissao && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <EmissaoStatus emissao={emissao} />
            </div>
          )}
        </Card>
      )}

      {/* ── Step 2: Caminho A — Schedule Start ── */}
      {path === 'birdid' && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 2 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Iniciar agendamento</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/schedule/start" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Importa o pedido na Soluti e gera o código de aceite. Os dados retornados são necessários no próximo passo.
          </p>

          <form onSubmit={handleStart} className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Protocolo externo (pedido)</label>
              <input
                type="text"
                value={solicitationCode}
                onChange={(e) => { setSolicitationCode(e.target.value); setStartData(null); }}
                maxLength={50}
                placeholder="Protocolo externo da venda"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors font-mono"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-blue-500"
              />
              <span className="text-xs text-zinc-400">Aceito a política de privacidade vinculada à videoconferência</span>
            </label>

            {startError && <p className="text-xs text-red-400">{startError}</p>}

            <button
              type="submit"
              disabled={starting || !solicitationCode.trim() || !aceite}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {starting ? 'Iniciando...' : 'Iniciar agendamento'}
            </button>
          </form>

          {startData && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
              <p className="text-[11px] text-zinc-500 font-medium">Agendamento iniciado</p>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-500 mb-0.5">Código de aceite</p>
                <p className="text-xs text-zinc-200 font-mono break-all">{startData.codigo_aceite}</p>
              </div>
              {startData.produtos.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5">
                  <p className="text-[11px] text-zinc-500 mb-1">Produtos</p>
                  <pre className="text-[11px] font-mono text-zinc-400 break-all whitespace-pre-wrap">
                    {JSON.stringify(startData.produtos, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-[11px] text-zinc-500">Guarde o código de aceite — será necessário no próximo passo.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

const STATUS_MAP: Record<number, { label: string; color: string; guidance: string }> = {
  0: { label: 'Aguardando CSR', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', guidance: 'Chame a emissão (POST /soluti/webservice/emit/issue).' },
  1: { label: 'Par de chaves gerado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', guidance: 'Chame a emissão (POST /soluti/webservice/emit/issue).' },
  2: { label: 'Certificado emitido', color: 'bg-green-500/10 text-green-400 border-green-500/20', guidance: 'Certificado pronto. Chame o recovery para obter o link de download.' },
  8: { label: 'Erro ao enviar', color: 'bg-red-500/10 text-red-400 border-red-500/20', guidance: 'Erro ao enviar solicitação de emissão. Reinicie o processo.' },
  9: { label: 'Erro ao emitir', color: 'bg-red-500/10 text-red-400 border-red-500/20', guidance: 'Erro ao emitir certificado. O cliente deve contatar a AR.' },
};

function EmissaoStatus({ emissao }: { emissao: WebServiceEmissao }) {
  const info = STATUS_MAP[emissao.status] ?? {
    label: `Status ${emissao.status}`,
    color: 'bg-zinc-700 text-zinc-400 border-zinc-600',
    guidance: 'Status desconhecido.',
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${info.color}`}>
          {info.label}
        </span>
        <span className="text-[11px] text-zinc-600">status {emissao.status}</span>
      </div>
      {(emissao.cn || emissao.cpf || emissao.cnpj) && (
        <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5 space-y-1">
          {emissao.cn && <p className="text-xs text-zinc-300"><span className="text-zinc-500">CN: </span>{emissao.cn}</p>}
          {emissao.cpf && <p className="text-xs text-zinc-400"><span className="text-zinc-500">CPF: </span>{emissao.cpf}</p>}
          {emissao.cnpj && <p className="text-xs text-zinc-400"><span className="text-zinc-500">CNPJ: </span>{emissao.cnpj}</p>}
        </div>
      )}
      <p className="text-[11px] text-zinc-500">{info.guidance}</p>
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
