@AGENTS.md

# Contexto do Projeto

Este projeto é um console/painel interno de uma **softwarehouse** que está integrando a **API InterSuite v2** ao seu software para implementar **venda e aprovação de certificados digitais**.

O dono do projeto **não tem conhecimento de certificação digital** — a API InterSuite abstrai toda essa complexidade. O papel deste sistema é consumir a API corretamente e expor os fluxos de forma simples para o usuário final.

## Arquitetura

- **Login do app** (`/login`): acesso ao console com credenciais do `.env`. Grava cookie `app_session`.
- **Dashboard** (`/dashboard`): área privada protegida pelo `proxy.ts`. Por enquanto vazio.
- **Configuração** (`/dashboard/configuracao`): autenticação na API InterSuite (Método 1: email/senha/tenant — Método 2: API Key). Grava `intersuite_token` no cookie, injetado automaticamente em todas as chamadas via interceptor do axios (`src/services/api/api.ts`).

## Regras da API InterSuite

- `X-Tenant` vai **apenas** no header do `/auth/login`. Depois, o tenant viaja dentro do JWT.
- `Authorization: <token>` — sem prefixo Bearer.
- Ambiente de homologação: `https://backhomolog.intersuite.com.br/api` (definido em `NEXT_PUBLIC_API_URL`).

## Estrutura de pastas relevante

```
src/
├── app/
│   ├── login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── _components/Sidebar.tsx
│   │   └── configuracao/page.tsx
│   └── proxy.ts              ← proteção de rotas (substitui middleware no Next.js 16)
├── components/ui/            ← componentes reutilizáveis (Field, Card, Alert, etc.)
├── services/api/
│   ├── api.ts                ← instância axios + interceptors de log e auth
│   └── auth.ts               ← loginWithCredentials, loginWithApiKey
├── types/auth.ts
└── lib/token.ts              ← save/get/removeToken (cookie intersuite_token)
```
