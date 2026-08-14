'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSale } from '@/services/api/sales';
import { discoverBirdId, scheduleStart, scheduleNewOrder, getAvailableTimes, scheduleAppointment, birdIdLogin, birdIdEmit, validateWebServiceEmit } from '@/services/api/soluti';
import type { SaleDetail } from '@/types/sales';
import type { BirdIdSlot, BirdIdLoginData, BirdIdEmitData, NewOrderData, ScheduleStartData, AvailableTimesData, WebServiceEmissao } from '@/types/soluti';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type Path = 'birdid' | 'webservice' | null;

interface SessionState {
  path: Path;
  document: string;
  slots: BirdIdSlot[] | null;
  aceite: boolean;
  startData: ScheduleStartData | null;
  orderData: NewOrderData | null;
  timesData: AvailableTimesData | null;
  selectedTime: string | null;
  scheduleConfirmed: boolean;
  loginData: BirdIdLoginData | null;
  emitData: BirdIdEmitData | null;
  emissao: WebServiceEmissao | null;
}

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

  // ── New Order (Caminho A) ────────────────────────────────────────
  const [birdPassword, setBirdPassword] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderData, setOrderData] = useState<NewOrderData | null>(null);

  // ── Available Times (Caminho A) ──────────────────────────────────
  const [scheduleDate, setScheduleDate] = useState('');
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesError, setTimesError] = useState('');
  const [timesData, setTimesData] = useState<AvailableTimesData | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // ── Schedule Confirm (Caminho A) ─────────────────────────────────
  const [schedulePassword, setSchedulePassword] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false);

  // ── Bird ID Login OTP (Caminho A) ────────────────────────────────
  const [otp, setOtp] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginData, setLoginData] = useState<BirdIdLoginData | null>(null);

  // ── Bird ID Emit (Caminho A) ─────────────────────────────────────
  const [birdEmitPassword, setBirdEmitPassword] = useState('');
  const [birdEmitPasswordConfirm, setBirdEmitPasswordConfirm] = useState('');
  const [emitCei, setEmitCei] = useState('');
  const [emitting, setEmitting] = useState(false);
  const [emitError, setEmitError] = useState('');
  const [emitData, setEmitData] = useState<BirdIdEmitData | null>(null);

  // ── Validate (Caminho B) ─────────────────────────────────────────
  const [solicitationCode, setSolicitationCode] = useState('');
  const [emitPassword, setEmitPassword] = useState('');
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState('');
  const [emissao, setEmissao] = useState<WebServiceEmissao | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionKey = `emissao_${uuid}`;

  useEffect(() => {
    getSale(uuid)
      .then((s) => {
        setSale(s);
        if (s.external_protocol) setSolicitationCode(s.external_protocol);

        try {
          const saved = sessionStorage.getItem(`emissao_${uuid}`);
          if (saved) {
            const parsed: SessionState = JSON.parse(saved);
            if (parsed.path) setPath(parsed.path);
            if (parsed.document) setDocument(parsed.document);
            else if (s.client?.holders_document) setDocument(s.client.holders_document);
            if (parsed.slots !== undefined) setSlots(parsed.slots);
            if (parsed.aceite) setAceite(parsed.aceite);
            if (parsed.startData) setStartData(parsed.startData);
            if (parsed.orderData) setOrderData(parsed.orderData);
            if (parsed.timesData) setTimesData(parsed.timesData);
            if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
            if (parsed.scheduleConfirmed) setScheduleConfirmed(parsed.scheduleConfirmed);
            if (parsed.loginData) setLoginData(parsed.loginData);
            if (parsed.emitData) setEmitData(parsed.emitData);
            if (parsed.emissao) setEmissao(parsed.emissao);
          } else {
            if (s.client?.holders_document) setDocument(s.client.holders_document);
          }
        } catch {
          if (s.client?.holders_document) setDocument(s.client.holders_document);
        }
      })
      .catch((err) => setSaleError(err instanceof Error ? err.message : 'Erro ao carregar venda.'))
      .finally(() => setSaleLoading(false));
  }, [uuid]);

  useEffect(() => {
    if (saleLoading) return;
    const state: SessionState = { path, document, slots, aceite, startData, orderData, timesData, selectedTime, scheduleConfirmed, loginData, emitData, emissao };
    sessionStorage.setItem(sessionKey, JSON.stringify(state));
  }, [path, document, slots, aceite, startData, orderData, timesData, selectedTime, scheduleConfirmed, loginData, emitData, emissao, sessionKey, saleLoading]);

  function clearSession() {
    sessionStorage.removeItem(sessionKey);
    setPath(null);
    setSlots(null);
    setAceite(false);
    setStartData(null);
    setOrderData(null);
    setTimesData(null);
    setSelectedTime(null);
    setScheduleConfirmed(false);
    setLoginData(null);
    setEmitData(null);
    setEmissao(null);
    setDiscoveryError('');
    setStartError('');
    setOrderError('');
    setValidateError('');
    setBirdPassword('');
    setEmitPassword('');
    if (sale?.client?.holders_document) setDocument(sale.client.holders_document);
  }

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

  async function handleBirdIdEmit(e: React.FormEvent) {
    e.preventDefault();
    if (!solicitationCode.trim() || !document.trim() || !isPasswordValid(birdEmitPassword) || birdEmitPassword !== birdEmitPasswordConfirm) return;
    setEmitting(true);
    setEmitError('');
    setEmitData(null);
    try {
      const result = await birdIdEmit(
        solicitationCode.trim(),
        document.replace(/\D/g, ''),
        birdEmitPassword,
        birdEmitPasswordConfirm,
        emitCei.trim() || undefined,
      );
      setEmitData(result);
    } catch (err) {
      setEmitError(err instanceof Error ? err.message : 'Erro ao emitir certificado.');
    } finally {
      setEmitting(false);
    }
  }

  async function handleBirdIdLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || !solicitationCode.trim() || !document.trim()) return;
    setLoggingIn(true);
    setLoginError('');
    setLoginData(null);
    try {
      const result = await birdIdLogin(document.replace(/\D/g, ''), otp.trim(), solicitationCode.trim());
      setLoginData(result);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erro ao realizar login Bird ID.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!orderData?.protocol || !selectedTime || !isPasswordValid(schedulePassword)) return;
    setScheduling(true);
    setScheduleError('');
    try {
      await scheduleAppointment(selectedTime, orderData.protocol, schedulePassword);
      setScheduleConfirmed(true);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Erro ao confirmar agendamento.');
    } finally {
      setScheduling(false);
    }
  }

  async function handleGetTimes(e: React.FormEvent) {
    e.preventDefault();
    if (!orderData?.protocol || !scheduleDate) return;
    setLoadingTimes(true);
    setTimesError('');
    setTimesData(null);
    try {
      const result = await getAvailableTimes(orderData.protocol, scheduleDate);
      setTimesData(result);
    } catch (err) {
      setTimesError(err instanceof Error ? err.message : 'Erro ao listar horários.');
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleNewOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!startData || !solicitationCode.trim() || !birdPassword.trim()) return;
    setOrdering(true);
    setOrderError('');
    setOrderData(null);
    try {
      const result = await scheduleNewOrder(
        solicitationCode.trim(),
        birdPassword,
        startData.produtos,
        startData.codigo_aceite,
      );
      setOrderData(result);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Erro ao criar ordem de agendamento.');
    } finally {
      setOrdering(false);
    }
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
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Voltar">
            <BackIcon className="w-4 h-4" />
          </button>
          <h1 className="text-white font-semibold text-xl">Emissão</h1>
        </div>
        {path !== null && (
          <button
            onClick={clearSession}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
            title="Limpar progresso salvo e recomeçar"
          >
            Limpar sessão
          </button>
        )}
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

      {/* ── Step 3: Caminho A — New Order ── */}
      {path === 'birdid' && startData && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 3 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Criar ordem de agendamento</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/schedule/new-order" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Cria a ordem na Soluti. O <strong className="text-zinc-500">protocol</strong> retornado é obrigatório nos próximos passos. Use a mesma senha no passo de agendamento.
          </p>

          <form onSubmit={handleNewOrder} className="space-y-3">
            <div className="bg-zinc-800/30 rounded-lg px-3 py-2.5 space-y-1.5">
              <p className="text-[11px] text-zinc-600">Preenchido automaticamente do passo anterior</p>
              <p className="text-[11px] text-zinc-500">Pedido: <span className="text-zinc-400 font-mono">{solicitationCode}</span></p>
              <p className="text-[11px] text-zinc-500">Código de aceite: <span className="text-zinc-400 font-mono">{startData.codigo_aceite}</span></p>
              <p className="text-[11px] text-zinc-500">Produtos: <span className="text-zinc-400">{startData.produtos.length} item(s)</span></p>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Senha do certificado Bird ID</label>
              <input
                type="password"
                value={birdPassword}
                onChange={(e) => { setBirdPassword(e.target.value); setOrderData(null); }}
                placeholder="Ex: Senha@123"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
              />
              <PasswordRules password={birdPassword} />
              <p className="text-[11px] text-zinc-600 mt-1">Use a mesma senha no passo de agendamento (schedule).</p>
            </div>

            {orderError && <p className="text-xs text-red-400">{orderError}</p>}

            <button
              type="submit"
              disabled={ordering || !isPasswordValid(birdPassword)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {ordering ? 'Criando ordem...' : 'Criar ordem'}
            </button>
          </form>

          {orderData && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
              <p className="text-[11px] text-green-400 font-medium">Ordem criada</p>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-500 mb-0.5">Protocol</p>
                <p className="text-xs text-zinc-200 font-mono break-all">{orderData.protocol}</p>
              </div>
              <p className="text-[11px] text-zinc-500">Guarde o protocol — necessário nos próximos passos.</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Step 4: Caminho A — Available Times ── */}
      {path === 'birdid' && orderData && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 4 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Listar horários disponíveis</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/schedule/available-times" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Consulta os horários disponíveis para a videoconferência em uma data específica.
          </p>

          <form onSubmit={handleGetTimes} className="space-y-3">
            <div className="bg-zinc-800/30 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-zinc-500">Protocol: <span className="text-zinc-400 font-mono">{orderData.protocol}</span></p>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 block mb-1.5">Data desejada</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => { setScheduleDate(e.target.value); setTimesData(null); }}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 px-3.5 py-2.5 transition-colors"
              />
              <p className="text-[11px] text-zinc-600 mt-1">Formato Y-m-d (ex: 2025-08-15).</p>
            </div>

            {timesError && <p className="text-xs text-red-400">{timesError}</p>}

            <button
              type="submit"
              disabled={loadingTimes || !scheduleDate}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loadingTimes ? 'Consultando...' : 'Listar horários'}
            </button>
          </form>

          {timesData && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <p className="text-[11px] text-green-400 font-medium">Horários disponíveis — clique para selecionar</p>
              <AvailableTimesGrid
                raw={timesData.availableTimes}
                selected={selectedTime}
                onSelect={(t) => { setSelectedTime(t); setScheduleConfirmed(false); setScheduleError(''); }}
              />
              {selectedTime && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-500">Selecionado:</span>
                  <span className="text-xs text-white font-mono bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded">{selectedTime}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Step 5: Caminho A — Confirm Schedule ── */}
      {path === 'birdid' && orderData && selectedTime && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 5 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Confirmar agendamento</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/schedule/schedule" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Confirma o horário na Soluti. Após a confirmação, o OTP é enviado ao celular do titular para uso no login Bird ID.
          </p>

          {scheduleConfirmed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                  Agendamento confirmado
                </span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5 space-y-1">
                <p className="text-[11px] text-zinc-500">Horário: <span className="text-zinc-300 font-mono">{selectedTime}</span></p>
                <p className="text-[11px] text-zinc-500">Protocol: <span className="text-zinc-400 font-mono">{orderData.protocol}</span></p>
              </div>
              <p className="text-[11px] text-zinc-400">O OTP foi enviado ao celular do titular. Solicite o código e siga para o login Bird ID (próximo passo).</p>
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-3">
              <div className="bg-zinc-800/30 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-zinc-600">Preenchido automaticamente</p>
                <p className="text-[11px] text-zinc-500">Horário: <span className="text-zinc-400 font-mono">{selectedTime}</span></p>
                <p className="text-[11px] text-zinc-500">Protocol: <span className="text-zinc-400 font-mono">{orderData.protocol}</span></p>
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">
                  Senha do certificado <span className="text-zinc-600">(mesma definida no passo 3)</span>
                </label>
                <input
                  type="password"
                  value={schedulePassword}
                  onChange={(e) => setSchedulePassword(e.target.value)}
                  placeholder="Ex: Senha@123"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
                />
                <PasswordRules password={schedulePassword} />
              </div>

              {scheduleError && <p className="text-xs text-red-400">{scheduleError}</p>}

              <button
                type="submit"
                disabled={scheduling || !isPasswordValid(schedulePassword)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {scheduling ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
            </form>
          )}
        </Card>
      )}

      {/* ── Step 6: Caminho A — Bird ID Login (OTP) ── */}
      {path === 'birdid' && scheduleConfirmed && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 6 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Login Bird ID (OTP)</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/birdid/login" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            O titular recebeu o OTP no celular após o agendamento. Solicite o código ao titular e insira abaixo para autenticar a sessão.
          </p>

          {loginData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                  Autenticado
                </span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-zinc-500">Nome: <span className="text-zinc-200">{loginData.auth.nome}</span></p>
                <p className="text-[11px] text-zinc-500">Session ID: <span className="text-zinc-400 font-mono break-all">{loginData.auth.sessionId}</span></p>
              </div>
              <p className="text-[11px] text-zinc-500">Sessão autenticada. Siga para a emissão do certificado (próximo passo).</p>
            </div>
          ) : (
            <form onSubmit={handleBirdIdLogin} className="space-y-3">
              <div className="bg-zinc-800/30 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-zinc-600">Preenchido automaticamente</p>
                <p className="text-[11px] text-zinc-500">Documento: <span className="text-zinc-400 font-mono">{formatDocument(document)}</span></p>
                <p className="text-[11px] text-zinc-500">Voucher: <span className="text-zinc-400 font-mono">{solicitationCode}</span></p>
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">OTP do app Bird ID</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={8}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors font-mono tracking-widest"
                />
                <p className="text-[11px] text-zinc-600 mt-1">Mín. 6 dígitos numéricos. Solicitado ao titular verbalmente ou por outro canal.</p>
              </div>

              {loginError && <p className="text-xs text-red-400">{loginError}</p>}

              <button
                type="submit"
                disabled={loggingIn || otp.length < 6}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {loggingIn ? 'Autenticando...' : 'Autenticar OTP'}
              </button>
            </form>
          )}
        </Card>
      )}

      {/* ── Step 7: Caminho A — Bird ID Emit ── */}
      {path === 'birdid' && loginData && (
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Passo 7 — Caminho A</p>
              <p className="text-sm text-zinc-200 font-medium">Emitir certificado Bird ID</p>
            </div>
            <EndpointBadge method="POST" path="/soluti/birdid/emit" visibility="Autenticado" />
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Conclui a emissão do certificado. O certificado é entregue diretamente na conta Bird ID do titular.
            O campo <span className="text-zinc-500">issued_at</span> é preenchido de forma assíncrona — monitore via GET /certificate/sales/{'{uuid}'}.
          </p>

          {emitData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                  Certificado emitido
                </span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-zinc-500">Tipo do produto: <span className="text-zinc-200">{emitData.tipoProduto}</span></p>
                <p className="text-[11px] text-zinc-500">QSA: <span className="text-zinc-300">{emitData.isQsa ? 'Sim' : 'Não'}</span></p>
              </div>
              <p className="text-[11px] text-zinc-400">
                O certificado foi emitido na conta Bird ID do titular. Monitore <span className="font-mono text-zinc-300">issued_at</span> via GET /certificate/sales/{'{uuid}'} para confirmar a conclusão.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBirdIdEmit} className="space-y-3">
              <div className="bg-zinc-800/30 rounded-lg px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-zinc-600">Preenchido automaticamente</p>
                <p className="text-[11px] text-zinc-500">Voucher: <span className="text-zinc-400 font-mono">{solicitationCode}</span></p>
                <p className="text-[11px] text-zinc-500">Documento: <span className="text-zinc-400 font-mono">{formatDocument(document)}</span></p>
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">Senha do certificado</label>
                <input
                  type="password"
                  value={birdEmitPassword}
                  onChange={(e) => setBirdEmitPassword(e.target.value)}
                  placeholder="Ex: Senha@123"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
                />
                <PasswordRules password={birdEmitPassword} />
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  value={birdEmitPasswordConfirm}
                  onChange={(e) => setBirdEmitPasswordConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full rounded-lg bg-zinc-800 border focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors ${
                    birdEmitPasswordConfirm && birdEmitPassword !== birdEmitPasswordConfirm
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-zinc-700 focus:border-blue-500'
                  }`}
                />
                {birdEmitPasswordConfirm && birdEmitPassword !== birdEmitPasswordConfirm && (
                  <p className="text-[11px] text-red-400 mt-1">As senhas não coincidem.</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5">
                  CEI <span className="text-zinc-600">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={emitCei}
                  onChange={(e) => setEmitCei(e.target.value)}
                  placeholder="Quando aplicável"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 transition-colors"
                />
              </div>

              {emitError && <p className="text-xs text-red-400">{emitError}</p>}

              <button
                type="submit"
                disabled={emitting || !isPasswordValid(birdEmitPassword) || birdEmitPassword !== birdEmitPasswordConfirm}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {emitting ? 'Emitindo...' : 'Emitir certificado'}
              </button>
            </form>
          )}
        </Card>
      )}

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
              <p className="text-[11px] text-green-400 font-medium">Agendamento iniciado</p>
              <div className="bg-zinc-800/50 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-500 mb-0.5">Código de aceite</p>
                <p className="text-xs text-zinc-200 font-mono break-all">{startData.codigo_aceite}</p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function parseAvailableTimes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string');
  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return str.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g) ?? [];
}

function AvailableTimesGrid({
  raw,
  selected,
  onSelect,
}: {
  raw: unknown;
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  const times = parseAvailableTimes(raw);

  if (times.length === 0) {
    return <p className="text-[11px] text-zinc-600">Nenhum horário disponível nesta data.</p>;
  }

  // group by date
  const grouped: Record<string, string[]> = {};
  for (const t of times) {
    const [date, time] = t.split(' ');
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(time);
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([date, slots]) => (
        <div key={date}>
          <p className="text-[11px] text-zinc-600 mb-2">{date}</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const full = `${date} ${slot}`;
              const isSelected = selected === full;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelect(full)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-blue-300'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function isPasswordValid(password: string) {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function PasswordRules({ password }: { password: string }) {
  const rules = [
    { label: 'Mín. 6 caracteres', ok: password.length >= 6 },
    { label: '1 letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: '1 número', ok: /[0-9]/.test(password) },
    { label: '1 caractere especial (!@#$...)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
      {rules.map((r) => (
        <span key={r.label} className={`text-[11px] flex items-center gap-1 ${r.ok ? 'text-green-400' : 'text-zinc-600'}`}>
          <span>{r.ok ? '✓' : '○'}</span> {r.label}
        </span>
      ))}
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
