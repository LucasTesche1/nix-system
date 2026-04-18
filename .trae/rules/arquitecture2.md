# 🧱 SYSTEM PROMPT — GOVERNANÇA DE ARQUITETURA

Você está trabalhando em um projeto já existente, inicialmente gerado por uma ferramenta automática (Loveable).

⚠️ OBJETIVO PRINCIPAL:
Evoluir e corrigir o sistema SEM quebrar consistência arquitetural e SEM reinventar estruturas existentes.

---

# 🚫 REGRA MAIS IMPORTANTE

NUNCA recrie:
- tabelas
- tipos
- entidades
- serviços já existentes

SEMPRE reutilize o que já existe.

---

# 🧠 CONTEXTO

Sistema de calendário de conteúdo com:

- Supabase (PostgreSQL + RLS)
- Acesso admin via auth
- Acesso cliente via token (sem auth)

---

# 🧱 ARQUITETURA OBRIGATÓRIA

Fluxo de dados:

UI (pages/components)
→ composables (useQuery/useMutation)
→ services (domínio)
→ lib/api.ts
→ lib/supabase.ts
→ Supabase

---

# 📌 REGRA DE CAMADAS

## UI
- Apenas renderização e interação
- NÃO contém regra de negócio
- NÃO acessa Supabase diretamente

---

## Composables
- Gerenciam estado (loading/error/data)
- Chamam services
- NÃO possuem lógica de negócio

---

## Services (ÚNICA CAMADA DE LÓGICA)

Responsável por:
- montar queries
- aplicar regras de negócio
- validar dados

🚫 PROIBIDO:
- duplicar tipos
- ignorar regras de segurança

---

## lib/api.ts
- único ponto de acesso ao Supabase
- padroniza select/insert/update

---

# 🧬 TIPAGEM (CRÍTICO)

Fonte única:
`src/integrations/supabase/types.ts`

Uso obrigatório:
- Tables<'tabela'>
- TablesInsert<'tabela'>
- TablesUpdate<'tabela'>

🚫 PROIBIDO:
- criar interfaces duplicadas
- inventar campos

---

# 🔐 SEGURANÇA

---

## 👑 Profissional
- autenticado via Supabase
- acesso controlado por RLS
- só vê dados onde `owner_id = auth.uid()`

---

## 👀 Cliente
- NÃO usa Supabase direto
- NÃO usa RLS
- usa Edge Functions com token

---

# ⚠️ REGRA ABSOLUTA

🚫 Cliente NUNCA acessa Supabase diretamente

---

# 🧠 EDGE FUNCTIONS (SE EXISTIREM OU FOREM CRIADAS)

Devem ser usadas para:

- validação de token
- leitura segura de calendário
- atualização de status pelo cliente

---

## Regras obrigatórias:

- validar token antes de qualquer ação
- limitar campos de update
- nunca expor dados sensíveis

---

# ⚙️ REGRAS DE NEGÓCIO

---

## Status de conteúdo

- draft → invisível ao cliente
- pending_review → cliente pode agir
- approved
- rejected

---

## Regra crítica

Se conteúdo aprovado for editado:
→ status deve voltar para `pending_review`

---

## Validação por tipo

POST:
- video → gancho, desenvolvimento, cta obrigatórios
- estatico → ideia + imagem obrigatórios
- carrossel → ideia + pelo menos 1 imagem

STORY:
- texto obrigatório
- dia_semana obrigatório

---

# 🧼 SOFT DELETE

Sempre respeitar:

WHERE deleted_at IS NULL

---

# 🔗 RELACIONAMENTOS

- conteudos.tipo = 'post' → deve existir em posts
- conteudos.tipo = 'story' → deve existir em stories

---

# 🎯 PADRÃO DE QUERY

---

## ✔️ Sempre:
- definir colunas explicitamente
- aplicar filtros
- usar api.ts

---

## ❌ Nunca:
- usar select *
- acessar colunas inexistentes
- fazer query direto na UI

---

# 🛠️ COMO IMPLEMENTAR NOVAS FEATURES OU FIXES

---

## Antes de escrever código:

1. Verificar se já existe:
   - service
   - função
   - query similar

2. Reutilizar ao máximo

---

## Ao implementar:

- seguir padrão existente
- manter consistência de naming
- não criar abstrações desnecessárias

---

## Ao alterar código existente:

- NÃO quebrar contratos
- NÃO mudar estrutura sem necessidade
- NÃO refatorar fora do escopo da tarefa

---

# 🚫 ERROS PROIBIDOS

- recriar services
- duplicar lógica
- ignorar RLS
- cliente acessando Supabase
- mover regra de negócio para UI
- alterar schema sem necessidade

---

# 🧭 REGRA FINAL

Se estiver em dúvida:

- É acesso? → RLS
- É cliente? → Edge Function
- É regra? → Service
- É visual? → UI

---

# 🎯 OBJETIVO

Evoluir o sistema existente com:

- consistência
- segurança
- reutilização
- zero duplicação

Sem reescrever o projeto.
Sem inventar novas arquiteturas.