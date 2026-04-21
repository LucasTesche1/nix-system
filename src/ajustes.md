
## 📄 Contexto

O sistema atualmente suporta dois tipos de conteúdo: `post` e `story`. A Profissional
precisa incluir automações de fluxo (ex: sequências de mensagens, respostas automáticas)
no calendário de conteúdo, de forma que o cliente também possa revisar, aprovar ou
reprovar esse tipo de entrega.

Como automações são uma entidade distinta de posts e stories — com campos próprios
e sem relação com formatos de mídia — elas devem ser tratadas como um novo tipo
de conteúdo dentro do sistema.

**Impacto:** Sem esse tipo, a Profissional é obrigada a gerenciar automações fora
do sistema, quebrando o fluxo centralizado de aprovação e perdendo o histórico
de validação pelo cliente.

---

## 🎯 Objetivo

Adicionar `automacao` como terceiro tipo válido de conteúdo, composto por `titulo`
e `fluxo` (texto livre), participando do mesmo ciclo de aprovação já existente
para posts e stories.

---

## 🧩 Escopo

- Adicionar `'automacao'` ao CHECK constraint do campo `tipo` na tabela `conteudos`
- Executar migração para criação da tabela `automacoes` conforme schema fornecido
- Adicionar coluna `titulo` à tabela `automacoes`
- Implementar criação, edição e exibição de automações na interface da Profissional
- Exibir automações na interface do cliente para aprovação/reprovação e comentário
- Integrar ao service e composables existentes seguindo a arquitetura do projeto

---

## 🚫 Fora do Escopo

- Execução ou integração real com ferramentas de automação externas
- Preview de fluxo em formato visual (ex: diagrama de nós)
- Versionamento diferenciado de automações em relação aos demais conteúdos
- Exportação de automações no PDF (escopo do PDF atual cobre apenas vídeos)

---

## ⚙️ Requisitos Técnicos

### Alterações no Banco

**1. Atualizar CHECK constraint em `conteudos.tipo`:**

```sql
ALTER TABLE conteudos
DROP CONSTRAINT conteudos_tipo_check;

ALTER TABLE conteudos
ADD CONSTRAINT conteudos_tipo_check
CHECK (tipo IN ('post', 'story', 'automacoes'));
```

**2. Criar tabela `automacoes` conforme schema fornecido + coluna `titulo`:**

```sql
CREATE TABLE public.automacoes (
  id          UUID NOT NULL DEFAULT gen_random_uuid(),
  conteudo_id UUID UNIQUE REFERENCES conteudos(id),
  titulo      TEXT NOT NULL,
  texto       TEXT NOT NULL,

  CONSTRAINT automacoes_pkey PRIMARY KEY (id)
);
```

> O campo `fluxo` descrito na spec será persistido na coluna `texto` conforme
> o schema fornecido. O alias "fluxo" deve ser usado apenas na camada de UI/UX.

---

### Campos da Entidade

| Campo        | Coluna no banco | Obrigatório | Descrição                        |
|--------------|-----------------|-------------|----------------------------------|
| Título       | `titulo`        | Sim         | Nome da automação                |
| Fluxo        | `texto`         | Sim         | Descrição textual do fluxo       |
| conteudo_id  | `conteudo_id`   | Sim         | Referência ao conteúdo base      |

---

### Criação de Automação (Profissional)

Ao criar um conteúdo do tipo `automacao`, o service deve:

1. Inserir na tabela `conteudos` com `tipo = 'automacao'`
2. Inserir na tabela `automacoes` com `titulo` e `texto` vinculados ao `conteudo_id`

Ambas as operações devem ocorrer de forma atômica (sequencial com rollback em caso
de falha na segunda inserção).

### Edição de Automação (Profissional)

- Permite editar `titulo` e `texto` em `automacoes`
- Permite editar campos base em `conteudos` (`data_publicacao`, `semana_id`, etc.)
- Se o conteúdo estiver com `status = 'approved'` ao ser editado:
  - `status` volta para `pending_review` (comportamento já existente via trigger)
  - `version` é incrementado automaticamente

### Validação pelo Cliente

- O cliente visualiza automações junto aos demais conteúdos do calendário
- Pode alterar `status`: `pending_review` → `approved` ou `rejected`
- Pode adicionar `comentario_cliente` (opcional)
- Não pode editar `titulo` nem `texto`

---

## 🗄️ Impacto em Dados

**Tabelas afetadas:**

| Tabela       | Tipo de alteração                                              |
|--------------|----------------------------------------------------------------|
| `conteudos`  | Atualização do CHECK constraint para incluir `'automacao'`    |
| `automacoes` | Criação da tabela (schema fornecido + coluna `titulo`)        |

**Método a implementar em `conteudos.service.ts` (ou `automacoes.service.ts`):**

- `criarAutomacao({ conteudo, automacao })` → insere em `conteudos` + `automacoes`
- `atualizarAutomacao({ conteudo_id, titulo, texto })` → atualiza `automacoes`
- `buscarAutomacaoPorConteudo(conteudo_id)` → retorna dados completos com join

---

## 🔐 Segurança

- A tabela `automacoes` deve ter política RLS equivalente às demais tabelas filhas
  (`posts`, `stories`), herdando o controle via `conteudo_id → calendario_id → cliente_id`
- O cliente não pode escrever em `automacoes` diretamente — apenas em `status` e
  `comentario_cliente` via `conteudos`

**Política RLS sugerida:**

```sql
CREATE POLICY "Owner access automacoes"
ON automacoes
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM conteudos co
    JOIN calendarios c ON c.id = co.calendario_id
    WHERE co.id = automacoes.conteudo_id
      AND is_owner(c.cliente_id)
  )
)
WITH CHECK (TRUE);
```

---

## 🧪 Critérios de Aceite

- [ ] A Profissional consegue criar um conteúdo do tipo `automacao` informando
      `titulo` e `fluxo`
- [ ] A automação aparece agrupada na semana correta dentro do calendário
- [ ] A Profissional consegue editar `titulo` e `fluxo` de uma automação existente
- [ ] Ao editar uma automação com `status = 'approved'`, o status volta para
      `pending_review` e `version` é incrementado
- [ ] A automação aparece na interface do cliente junto aos demais conteúdos
- [ ] O cliente consegue aprovar uma automação
- [ ] O cliente consegue reprovar uma automação
- [ ] O cliente consegue deixar um comentário ao aprovar ou reprovar
- [ ] Automações com `status = 'draft'` **não aparecem** para o cliente
- [ ] A tabela `automacoes` possui RLS equivalente às demais tabelas filhas
- [ ] O CHECK constraint de `conteudos.tipo` aceita `'automacao'` sem erro

---

## 🧠 Observações Técnicas

- **Suposição:** o campo `fluxo` na especificação corresponde à coluna `texto`
  do schema fornecido — a UI deve exibir o label "Fluxo" mas persistir em `texto`
- **Suposição:** automações não possuem `deleted_at` próprio — o soft delete é
  controlado pelo `deleted_at` do `conteudo` pai, seguindo o padrão das demais
  entidades filhas (`post_videos`, `stories`, etc.)
- A constraint `UNIQUE` em `conteudo_id` já está no schema fornecido, garantindo
  relação 1:1 entre `conteudos` e `automacoes`
- Seguir o fluxo obrigatório: `Page → Composable → Service → api.ts → Supabase`
- O trigger `trg_conteudos_version` já cobre o incremento de `version` e reset
  de `status` — nenhuma lógica adicional necessária para esse comportamento
````