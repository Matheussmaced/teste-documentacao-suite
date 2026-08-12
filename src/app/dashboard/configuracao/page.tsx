'use client';

import { useState, useEffect } from 'react';
import { loginWithCredentials, loginWithApiKey } from '@/services/api/auth';
import { saveToken, getToken } from '@/lib/token';
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
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(!!getToken());
  }, []);

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

      {isConfigured && !success && (
        <Alert variant="success" title="API InterSuite conectada" className="mb-6">
          Token ativo. Reautentique abaixo para atualizá-lo.
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Token atualizado com sucesso" className="mb-6">
          Novo JWT salvo e injetado nas requisições.
        </Alert>
      )}

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
