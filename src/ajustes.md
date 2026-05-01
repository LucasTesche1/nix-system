## 📄 Contexto

Após o cliente alterar o status de um conteúdo para `approved` ou `rejected`,
o fluxo esperado é que a Profissional consiga editar o conteúdo (ex: adicionar
observações, corrigir roteiro) e reabri-lo para uma nova rodada de validação,
alterando o status de volta para `pending_review`.

O que ocorre na prática: após a ação do cliente, a interface da Profissional
não permite alterar o status do conteúdo, bloqueando o ciclo de revisão.

**Exemplo do problema:**

```
1. Profissional envia calendário → conteúdo em `pending_review`
2. Cliente reprova o conteúdo → status = `rejected`
3. Profissional adiciona observações e tenta reabrir para validação
4. ❌ A interface não permite alterar o status
5. Ciclo de revisão trava
```

**Impacto:** O fluxo de aprovação fica bloqueado após qualquer ação do cliente,
impedindo a Profissional de iterar sobre o conteúdo e reenviar para validação —
funcionalidade central do sistema.

---

## 🎯 Objetivo

Garantir que a Profissional consiga, a qualquer momento, alterar o status de um
conteúdo de volta para `pending_review`, reativando o ciclo de validação pelo
cliente.

---

## 🧩 Escopo

- Identificar e corrigir o bloqueio de alteração de status na interface da Profissional
- Garantir que a Profissional possa transitar o status de qualquer estado para
  `pending_review`
- Validar que o comportamento do trigger de versionamento continua funcionando
  corretamente após a correção

---

## 🚫 Fora do Escopo

- Alteração das permissões do cliente (o cliente continua podendo apenas aprovar
  ou reprovar)
- Criação de histórico de status por conteúdo
- Notificação ao cliente ao reabrir um conteúdo para validação
- Alteração do trigger `trg_conteudos_version` existente no banco

---

## ⚙️ Requisitos Técnicos

### Transições de Status Permitidas por Ator

**Cliente:**

| De               | Para       |
|------------------|------------|
| `pending_review` | `approved` |
| `pending_review` | `rejected` |

**Profissional:**

| De               | Para             |
|------------------|------------------|
| `draft`          | `pending_review` |
| `pending_review` | `draft`          |
| `approved`       | `pending_review` |
| `rejected`       | `pending_review` |

> A Profissional deve conseguir transitar de **qualquer status** para
> `pending_review` — esse é o mecanismo de reabertura para nova validação.

### Investigação do Bloqueio

Verificar as seguintes causas prováveis:

- [ ] **Condição de guarda na UI:** componente de status da Profissional está
      condicionando a exibição/habilitação dos controles com base no status atual,
      bloqueando edição quando `status = 'approved'` ou `status = 'rejected'`
- [ ] **Validação incorreta no service:** `atualizarStatus` está rejeitando
      transições que partem de `approved` ou `rejected`
- [ ] **Campo readonly indevido:** o controle de status está marcado como
      `disabled` ou `readOnly` para a Profissional nos mesmos estados que são
      readonly para o cliente

### Comportamento Esperado Após Correção

- Profissional acessa conteúdo com `status = 'rejected'` ou `status = 'approved'`
- Interface exibe a opção de reabrir para revisão (ex: botão "Reabrir para validação"
  ou seletor de status habilitado)
- Ao confirmar, `status` é atualizado para `pending_review`
- O trigger de banco `trg_conteudos_version` incrementa `version` automaticamente
  (comportamento já existente para edição de conteúdo aprovado)
- O conteúdo volta a aparecer como revisável na interface do cliente

---

## 🗄️ Impacto em Dados

Nenhuma alteração de schema necessária.

O trigger `trg_conteudos_version` já contempla o comportamento correto:

```sql
-- Ao editar conteúdo aprovado, reseta status e incrementa version
IF OLD.status = 'approved' THEN
  NEW.status = 'pending_review';
END IF;
```

> **Atenção:** o trigger só reseta o status quando o conteúdo está em `approved`.
> Para `rejected`, a transição para `pending_review` deve ser feita
> **explicitamente pelo service** — o trigger não cobre esse caso.

**Método a verificar/corrigir em `conteudos.service.ts`:**

- `atualizarStatus({ id, status })` → garantir que aceita a transição para
  `pending_review` partindo de qualquer status

---

## 🔐 Segurança

- A transição de status pela Profissional deve ocorrer apenas em rotas
  autenticadas (usuário logado com `auth.uid()`)
- O cliente **não deve conseguir** transitar status para `pending_review` —
  essa transição é exclusiva da Profissional
- Validar no service (não apenas no frontend) qual ator está realizando
  a alteração de status

---

## 🧪 Critérios de Aceite

- [ ] A Profissional consegue alterar o status de `rejected` para `pending_review`
- [ ] A Profissional consegue alterar o status de `approved` para `pending_review`
- [ ] Após a reabertura, o conteúdo aparece como `pending_review` na interface
      do cliente
- [ ] O campo `version` é incrementado ao reabrir um conteúdo `approved`
- [ ] O cliente **não consegue** transitar status para `pending_review`
- [ ] A interface da Profissional exibe os controles de status habilitados para
      conteúdos em qualquer status
- [ ] A correção se aplica para os três tipos de conteúdo: `post`, `story`
      e `automacao`

---

## 🧠 Observações Técnicas

- **Causa mais provável:** a interface está reutilizando a mesma lógica de
  controle de status do cliente para a visão da Profissional, aplicando
  indevidamente as restrições de transição do cliente para ambos os atores
- O trigger `trg_conteudos_version` trata apenas a transição a partir de
  `approved` — para `rejected → pending_review`, o `version` **não será
  incrementado automaticamente**; avaliar se isso é o comportamento desejado
  ou se o trigger deve ser estendido para cobrir `rejected` também
- Seguir o fluxo obrigatório: `Page → Composable → Service → api.ts → Supabase`
- A correção deve ser feita nas duas camadas: **service** (validação de transição)
  e **UI** (habilitação dos controles) para garantir consistência