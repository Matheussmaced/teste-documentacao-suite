'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Alert } from '@/components/ui/Alert';

const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL ?? '';
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD ?? '';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.email === APP_EMAIL && form.password === APP_PASSWORD) {
      document.cookie = `app_session=authenticated; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
      router.push('/dashboard');
    } else {
      setError('E-mail ou senha incorretos.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center flex flex-col items-center">
          <Logo subtitle="v2 · Console" />
        </div>

        <Card className="p-8">
          <h1 className="text-white font-semibold text-lg mb-6">Entrar</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="E-mail"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field
              label="Senha"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <SubmitButton label="Entrar" loadingLabel="Entrando..." />
          </form>
        </Card>

      </div>
    </div>
  );
}
