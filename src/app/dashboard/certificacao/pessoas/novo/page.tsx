'use client';

import { useState } from 'react';
import { createPerson } from '@/services/api/persons';
import type { CreatePersonPayload, Person } from '@/types/persons';
import { Field } from '@/components/ui/Field';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { EndpointBadge } from '@/components/ui/EndpointBadge';

type PersonType = 'pf' | 'pj';

const emptyForm = {
  holders_document: '',
  holders_name: '',
  email: '',
  birth_date: '',
  cellphone: '',
  phone: '',
  address_zipcode: '',
  address: '',
  address_number: '',
  address_compl: '',
  address_neighb: '',
  address_city: '',
  address_uf: '',
  address_ibge: '',
  document: '',
  name: '',
  fantasy_name: '',
};

export default function NovaPessoaPage() {
  const [type, setType] = useState<PersonType>('pf');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Person | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTypeChange(t: PersonType) {
    setType(t);
    setError('');
  }

  function handleReset() {
    setForm(emptyForm);
    setError('');
    setCreated(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: CreatePersonPayload = {
        holders_document: form.holders_document,
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
        ...(form.phone && { phone: form.phone }),
        ...(form.address_compl && { address_compl: form.address_compl }),
        ...(type === 'pj' && {
          document: form.document,
          name: form.name,
          ...(form.fantasy_name && { fantasy_name: form.fantasy_name }),
        }),
      };
      const person = await createPerson(payload);
      setCreated(person);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar pessoa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-white font-semibold text-xl mb-1">Cadastrar Pessoa</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Cria uma pessoa física (titular) ou jurídica (titular + dados da empresa).
      </p>

      {created && (
        <Alert variant="success" title="Pessoa cadastrada com sucesso" className="mb-6">
          <p className="font-mono">{created.uuid}</p>
          <p className="mt-1">{created.holders_name} · {created.address_city}/{created.address_uf}</p>
          <button
            onClick={handleReset}
            className="mt-3 text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            Cadastrar outra pessoa
          </button>
        </Alert>
      )}

      {!created && (
        <Card className="p-6">
          <EndpointBadge method="POST" path="/persons" visibility="Autenticado" />

          <div className="flex gap-1 my-6 bg-zinc-800 rounded-lg p-1">
            {(['pf', 'pj'] as PersonType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
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
              onChange={handleChange} required
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
            <SubmitButton loading={loading} label="Cadastrar Pessoa" loadingLabel="Cadastrando..." />
          </form>
        </Card>
      )}
    </div>
  );
}
