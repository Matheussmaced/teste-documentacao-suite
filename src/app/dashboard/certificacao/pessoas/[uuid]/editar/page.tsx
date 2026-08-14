'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPerson, updatePerson } from '@/services/api/persons';
import type { Person, UpdatePersonPayload } from '@/types/persons';
import { Field } from '@/components/ui/Field';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type PersonType = 'pf' | 'pj';

function personToForm(p: Person) {
  return {
    holders_document: p.holders_document ?? '',
    holders_name: p.holders_name ?? '',
    email: p.email ?? '',
    birth_date: p.birth_date ?? '',
    cellphone: p.cellphone ?? '',
    phone: p.phone ?? '',
    address_zipcode: p.address_zipcode ?? '',
    address: p.address ?? '',
    address_number: p.address_number ?? '',
    address_compl: p.address_compl ?? '',
    address_neighb: p.address_neighb ?? '',
    address_city: p.address_city ?? '',
    address_uf: p.address_uf ?? '',
    address_ibge: p.address_ibge ?? '',
    document: p.document ?? '',
    name: p.name ?? '',
    fantasy_name: p.fantasy_name ?? '',
  };
}

export default function EditarPessoaPage() {
  const router = useRouter();
  const params = useParams();
  const uuid = params.uuid as string;

  const [type, setType] = useState<PersonType>('pf');
  const [form, setForm] = useState(personToForm({} as Person));
  const [loadingPerson, setLoadingPerson] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getPerson(uuid)
      .then((p) => {
        setForm(personToForm(p));
        setType(p.document ? 'pj' : 'pf');
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar pessoa.'))
      .finally(() => setLoadingPerson(false));
  }, [uuid]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: UpdatePersonPayload = {
        holders_name: form.holders_name,
        email: form.email,
        birth_date: form.birth_date,
        cellphone: form.cellphone,
        address_zipcode: form.address_zipcode,
        address: form.address,
        address_number: form.address_number,
        address_neighb: form.address_neighb,
        address_city: form.address_city,
        address_uf: form.address_uf,
        address_ibge: form.address_ibge,
        ...(form.holders_document && { holders_document: form.holders_document }),
        ...(form.phone && { phone: form.phone }),
        ...(form.address_compl && { address_compl: form.address_compl }),
        ...(type === 'pj' && {
          document: form.document,
          name: form.name,
          ...(form.fantasy_name && { fantasy_name: form.fantasy_name }),
        }),
      };
      await updatePerson(uuid, payload);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pessoa.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingPerson) {
    return (
      <div className="max-w-xl">
        <p className="text-zinc-500 text-sm">Carregando dados...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl">
        <Alert variant="error" title="Erro ao carregar pessoa">{loadError}</Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl">
        <h1 className="text-white font-semibold text-xl mb-1">Editar Pessoa</h1>
        <Alert variant="success" title="Pessoa atualizada com sucesso" className="mt-6">
          <p>{form.holders_name}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Continuar editando
            </button>
            <button
              onClick={() => router.push(`/dashboard/certificacao/pessoas/${uuid}`)}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Ver detalhe
            </button>
            <button
              onClick={() => router.push('/dashboard/certificacao/pessoas')}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Voltar à lista
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Voltar
        </button>
        <h1 className="text-white font-semibold text-xl mb-1">Editar Pessoa</h1>
        <p className="text-zinc-500 text-sm">Atualize os dados do cadastro.</p>
      </div>

      <Card className="p-6">
        <EndpointBadge method="PATCH" path={`/persons/${uuid}`} visibility="Autenticado" />

        <div className="flex gap-1 my-6 bg-zinc-800 rounded-lg p-1">
          {(['pf', 'pj'] as PersonType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                type === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="CPF do Titular" name="holders_document" type="text"
            placeholder="123.456.789-00" value={form.holders_document}
            onChange={handleChange}
          />
          <Field
            label="Nome Completo" name="holders_name" type="text"
            placeholder="Maria Oliveira" value={form.holders_name}
            onChange={handleChange} required
          />
          <Field
            label="E-mail" name="email" type="email"
            placeholder="maria@exemplo.com.br" value={form.email}
            onChange={handleChange} required
          />
          <Field
            label="Data de Nascimento" name="birth_date" type="text"
            placeholder="15-06-1990" value={form.birth_date}
            onChange={handleChange} required tag="dd-mm-aaaa"
          />
          <Field
            label="Celular" name="cellphone" type="text"
            placeholder="(85) 99999-8888" value={form.cellphone}
            onChange={handleChange} required
          />
          <Field
            label="Telefone" name="phone" type="text"
            placeholder="(85) 3333-4444" value={form.phone}
            onChange={handleChange} tag="Opcional"
          />

          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-4">Endereço</p>
            <div className="space-y-4">
              <Field
                label="CEP" name="address_zipcode" type="text"
                placeholder="63180-000" value={form.address_zipcode}
                onChange={handleChange} required
              />
              <Field
                label="Rua / Avenida" name="address" type="text"
                placeholder="Rua Padre Cícero" value={form.address}
                onChange={handleChange} required
              />
              <Field
                label="Número" name="address_number" type="text"
                placeholder="1234" value={form.address_number}
                onChange={handleChange} required
              />
              <Field
                label="Complemento" name="address_compl" type="text"
                placeholder="Sala 2" value={form.address_compl}
                onChange={handleChange} tag="Opcional"
              />
              <Field
                label="Bairro" name="address_neighb" type="text"
                placeholder="Centro" value={form.address_neighb}
                onChange={handleChange} required
              />
              <Field
                label="Cidade" name="address_city" type="text"
                placeholder="Juazeiro do Norte" value={form.address_city}
                onChange={handleChange} required
              />
              <Field
                label="Estado (UF)" name="address_uf" type="text"
                placeholder="CE" value={form.address_uf}
                onChange={handleChange} required
              />
              <Field
                label="Código IBGE" name="address_ibge" type="text"
                placeholder="2307304" value={form.address_ibge}
                onChange={handleChange} required
              />
            </div>
          </div>

          {type === 'pj' && (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-4">Dados da Empresa</p>
              <div className="space-y-4">
                <Field
                  label="CNPJ" name="document" type="text"
                  placeholder="12.345.678/0001-90" value={form.document}
                  onChange={handleChange} required
                />
                <Field
                  label="Razão Social" name="name" type="text"
                  placeholder="Razão Social Ltda" value={form.name}
                  onChange={handleChange} required
                />
                <Field
                  label="Nome Fantasia" name="fantasy_name" type="text"
                  placeholder="ABC Comércio" value={form.fantasy_name}
                  onChange={handleChange} tag="Opcional"
                />
              </div>
            </div>
          )}

          {error && <Alert variant="error">{error}</Alert>}
          <SubmitButton loading={loading} label="Salvar Alterações" loadingLabel="Salvando..." />
        </form>
      </Card>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}
