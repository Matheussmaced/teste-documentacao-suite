'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPerson } from '@/services/api/persons';
import type { Person } from '@/types/persons';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

function Row({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 font-mono shrink-0 w-44">{label}</span>
      <span className={`text-xs text-zinc-300 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
      {children}
    </span>
  );
}

export default function DetalhePessoaPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getPerson(uuid);
        setPerson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pessoa.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uuid]);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Voltar"
        >
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="text-white font-semibold text-xl">Detalhe da Pessoa</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-8 ml-7">
        {loading ? 'Carregando...' : person ? person.holders_name : 'Pessoa não encontrada'}
      </p>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading && (
        <Card className="p-6">
          <div className="text-zinc-500 text-sm text-center py-8">Carregando...</div>
        </Card>
      )}

      {!loading && person && (
        <>
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <EndpointBadge method="GET" path={`/persons/${uuid}`} visibility="Autenticado" />
              <div className="flex items-center gap-2">
                {person.has_birdid && (
                  <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5">
                    Bird ID
                  </span>
                )}
                <Badge>{person.document ? 'Pessoa Jurídica' : 'Pessoa Física'}</Badge>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-2">Titular</p>
            <Row label="uuid" value={person.uuid} mono />
            <Row label="holders_document" value={person.holders_document} mono />
            <Row label="holders_name" value={person.holders_name} />
            <Row label="email" value={person.email} mono />
            <Row label="birth_date" value={person.birth_date} mono />
            <Row label="cellphone" value={person.cellphone} mono />
            <Row label="phone" value={person.phone} mono />
          </Card>

          {person.document && (
            <Card className="p-6 mb-4">
              <p className="text-xs text-zinc-500 mb-2">Empresa</p>
              <Row label="document" value={person.document} mono />
              <Row label="name" value={person.name} />
              <Row label="fantasy_name" value={person.fantasy_name} />
            </Card>
          )}

          <Card className="p-6 mb-4">
            <p className="text-xs text-zinc-500 mb-2">Endereço</p>
            <Row label="address_zipcode" value={person.address_zipcode} mono />
            <Row label="address" value={person.address} />
            <Row label="address_number" value={person.address_number} mono />
            <Row label="address_compl" value={person.address_compl} />
            <Row label="address_neighb" value={person.address_neighb} />
            <Row label="address_city" value={person.address_city} />
            <Row label="address_uf" value={person.address_uf} mono />
            <Row label="address_ibge" value={person.address_ibge} mono />
          </Card>

          <Card className="p-6">
            <p className="text-xs text-zinc-500 mb-2">Metadados</p>
            <Row label="fathers_uuid" value={person.fathers_uuid} mono />
            <Row label="created_at" value={person.created_at} mono />
            <Row label="updated_at" value={person.updated_at} mono />
          </Card>
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
