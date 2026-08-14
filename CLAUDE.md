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

## Navegação (Sidebar)

O sidebar usa um sistema de flyout em cascata (abre painéis à direita, não dropdown para baixo). Estrutura de até 3 níveis:

```
Sidebar principal (w-56)
└── Item com filhos → Flyout L1 (w-44, abre à direita)
                      └── Item com filhos → Flyout L2 (w-44, abre à direita)
                                            └── Links finais (rotas)
```

**Para adicionar novos itens de menu**, editar apenas o `navConfig` no topo de `src/app/dashboard/_components/Sidebar.tsx`. Não mexer na lógica do componente.

Estrutura atual do navConfig:
```
Início               → /dashboard
Certificação
  └── Pessoas
        ├── Listar   → /dashboard/certificacao/pessoas
        └── Cadastrar → /dashboard/certificacao/pessoas/novo
Configuração         → /dashboard/configuracao
```

O fluxo completo de certificação é dividido em: **Pessoas** (CRUD completo) → **Venda** → outros. Cada grupo novo de endpoints vira uma entrada no navConfig sob "Certificação".

### Módulo Pessoas — implementado

Rotas:
```
/dashboard/certificacao/pessoas          → listagem paginada com busca
/dashboard/certificacao/pessoas/novo     → cadastro (PF / PJ)
/dashboard/certificacao/pessoas/[uuid]   → detalhe completo
```

Arquivos:
```
src/types/persons.ts                     ← CreatePersonPayload, Person, PersonResponse, Pagination, PersonsListResponse
src/services/api/persons.ts              ← getPersons, getPerson, createPerson, deletePerson
src/app/dashboard/certificacao/pessoas/
  page.tsx                               ← tabela com busca, paginação, ícones: olho, editar (sem lógica), lixeira com confirm inline
  novo/page.tsx                          ← form PF/PJ, toggle, success state com UUID retornado
  [uuid]/page.tsx                        ← 4 cards: Titular, Empresa (só PJ), Endereço, Metadados
```

Comportamentos importantes:
- **Delete**: lixeira → confirm inline na linha → `DELETE /persons/{uuid}` → remove da lista sem refetch
- **Erros da API de Pessoas**: a API usa 403 (não 422) para validação de campos, com `errors: { field: [msg] }`. Para 500, usa `error: string` com mensagem legível (ex: "O CEP informado é inválido.").
- **Token inválido**: `fetchUser` em configuracao chama `removeToken()` ao receber 401, limpando cookie stale.

Ainda falta implementar:
- Editar pessoa (`PATCH /persons/{uuid}`) — botão lápis já existe na tabela, sem lógica

## Estrutura de pastas relevante

```
src/
├── app/
│   ├── login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── _components/Sidebar.tsx   ← navConfig aqui
│   │   ├── configuracao/page.tsx
│   │   └── certificacao/             ← páginas dos endpoints (a criar)
│   └── proxy.ts                      ← proteção de rotas (Next.js 16)
├── components/ui/                    ← Field, Card, Alert, EndpointBadge, etc.
├── services/api/
│   ├── api.ts                        ← instância axios + interceptors de log e auth
│   └── auth.ts                       ← loginWithCredentials, loginWithApiKey, getMe, logout
├── types/auth.ts
└── lib/token.ts                      ← save/get/removeToken (cookie intersuite_token)
```
