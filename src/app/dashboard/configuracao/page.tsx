'use client';

import { useState, useEffect } from 'react';
import { loginWithCredentials, loginWithApiKey, getMe, logout } from '@/services/api/auth';
import { saveToken, getToken, removeToken } from '@/lib/token';
import type { User } from '@/types/auth';
import { Field } from '@/components/ui/Field';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type Method = 'credentials' | 'apikey';

export default function ConfiguracaoPage() {
  const [method, setMethod] = useState<Method>('credentials');
  const [credForm, setCredForm] = useState({ email: '', password: '', tenant: '' });
  const [apiKeyForm, setApiKeyForm] = useState({ api_key: '', tenant: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (getToken()) fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      removeToken();
      setUser(null);
    }
  }

  async function handleDisconnect() {
    await logout();
    removeToken();
    setUser(null);
    setSuccess(false);
  }

  function reset() {
    setError('');
    setSuccess(false);
  }

  function handleCredChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCredForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleApiKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setApiKeyForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCredSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const { token } = await loginWithCredentials(
        { email: credForm.email, password: credForm.password },
        credForm.tenant
      );
      saveToken(token);
      setSuccess(true);
      setCredForm({ email: '', password: '', tenant: '' });
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  async function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const { token } = await loginWithApiKey(
        { api_key: apiKeyForm.api_key },
        apiKeyForm.tenant
      );
      saveToken(token);
      setSuccess(true);
      setApiKeyForm({ api_key: '', tenant: '' });
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-white font-semibold text-xl mb-1">Configuração</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Autentique na API InterSuite para desbloquear as funcionalidades do sistema.
      </p>

      {/* Usuário autenticado */}
      {user && (
        <Card className="p-4 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">
                {user.name.charAt(0).toUpperCase()}{user.last_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user.name} {user.last_name}
                </p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user.is_adm && (
                <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5">
                  Admin
                </span>
              )}
              <span className="text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
                {user.group.name}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Desconectar do InterSuite
            </button>
          </div>
        </Card>
      )}

      {success && (
        <Alert variant="success" title="Token atualizado com sucesso" className="mb-6">
          Novo JWT salvo e injetado nas requisições.
        </Alert>
      )}

      {/* Card de autenticação */}
      <Card className="p-6">
        <EndpointBadge method="POST" path="/auth/login" visibility="Público" />

        <div className="flex gap-1 my-6 bg-zinc-800 rounded-lg p-1">
          {(['credentials', 'apikey'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); reset(); }}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                method === m ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m === 'credentials' ? 'Método 1 · Credenciais' : 'Método 2 · API Key'}
            </button>
          ))}
        </div>

        <Alert variant="warning" className="mb-5">
          <span className="font-semibold text-amber-400">X-Tenant obrigatório nesta rota.</span>{' '}
          Após o login, o tenant viaja internamente no JWT — não é reenviado nas demais chamadas.
        </Alert>

        {method === 'credentials' && (
          <form onSubmit={handleCredSubmit} className="space-y-4">
            <Field label="X-Tenant" name="tenant" type="text" placeholder="uuid-do-tenant"
              value={credForm.tenant} onChange={handleCredChange} required hint="Identificador do tenant." mono />
            <Field label="email" name="email" type="email" placeholder="operador@exemplo.com.br"
              value={credForm.email} onChange={handleCredChange} required tag="string · Obrigatório" mono />
            <Field label="password" name="password" type="password" placeholder="••••••••"
              value={credForm.password} onChange={handleCredChange} required tag="string · Obrigatório" mono />

            {error && <Alert variant="error">{error}</Alert>}
            <SubmitButton loading={loading} label="Autenticar" />
          </form>
        )}

        {method === 'apikey' && (
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Alert variant="info">
              Indicado para integrações máquina a máquina.{' '}
              <span className="text-zinc-300">A api_key vai apenas no body</span> — não é enviada no header{' '}
              <code className="font-mono">Authorization</code>.
              Quando presente, <code className="font-mono">email</code> e{' '}
              <code className="font-mono">password</code> são ignorados.
            </Alert>

            <Field label="X-Tenant" name="tenant" type="text" placeholder="uuid-do-tenant"
              value={apiKeyForm.tenant} onChange={handleApiKeyChange} required hint="Identificador do tenant." mono />
            <Field label="api_key" name="api_key" type="password" placeholder="sua-chave-de-api"
              value={apiKeyForm.api_key} onChange={handleApiKeyChange} required tag="string · Obrigatório" mono />

            {error && <Alert variant="error">{error}</Alert>}
            <SubmitButton loading={loading} label="Autenticar com API Key" />
          </form>
        )}
      </Card>
    </div>
  );
}
