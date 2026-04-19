## 📄 Contexto

Atualmente, o campo `comentario_cliente` existe na tabela `conteudos`, mas o fluxo
de validação não deixa claro que o cliente pode comentar independentemente do status
escolhido — incluindo `approved`.

Além disso, não há na interface da Profissional nenhuma área dedicada para visualizar
os comentários deixados pelos clientes, o que quebra o ciclo de comunicação entre as partes.

**Impacto:** A Profissional perde feedbacks importantes do cliente, mesmo quando o conteúdo
é aprovado com ressalvas ou observações pontuais.

---

## 🎯 Objetivo

- Permitir que o cliente adicione um comentário em qualquer conteúdo, independentemente
  do status escolhido (`approved`, `rejected` ou `pending_review`)
- Exibir esses comentários de forma clara para a Profissional na interface de gestão

---

## 🧩 Escopo

- Tornar o campo de comentário disponível na interface do cliente para todos os status
- Salvar `comentario_cliente` via service ao submeter aprovação/rejeição
- Exibir `comentario_cliente` na interface da Profissional por conteúdo
- Indicar visualmente quais conteúdos possuem comentário

---

## 🚫 Fora do Escopo

- Histórico de comentários (múltiplos comentários por conteúdo — apenas o mais recente)
- Resposta da Profissional ao comentário do cliente
- Notificações em tempo real ao receber comentário
- Comentários em nível de calendário ou semana

---

## ⚙️ Requisitos Técnicos

### Interface do Cliente

- O campo de comentário deve ser **opcional** e estar disponível junto à ação de
  alterar status (aprovar/reprovar)
- Deve aceitar texto livre
- Deve ser enviado junto com a atualização de status em uma única operação
- Placeholder sugerido: `"Deixe um comentário para a equipe (opcional)"`

### Persistência

- Atualizar `comentario_cliente` e `status` na tabela `conteudos` na mesma chamada
- Se o cliente não preencher o campo, o valor anterior deve ser **substituído por `NULL`**
  (comentário reflete sempre a última interação)

### Interface da Profissional

- Exibir o `comentario_cliente` no card/detalhe de cada conteúdo quando preenchido
- Indicar visualmente (ex: ícone de balão ou badge) que aquele conteúdo possui comentário
- O campo deve ser **somente leitura** para a Profissional nessa interface

---

## 🗄️ Impacto em Dados

**Tabela afetada:** `conteudos`

| Coluna               | Comportamento                                              |
|----------------------|------------------------------------------------------------|
| `comentario_cliente` | Atualizado junto com `status`; `NULL` se não preenchido   |
| `status`             | Atualizado normalmente pelo cliente                        |

> Não há alteração de schema — coluna já existe.

**Método a implementar/atualizar em `conteudos.service.ts`:**

- `atualizarStatusCliente({ id, status, comentario_cliente })` → atualiza ambos os campos
  em uma única chamada

---

## 🔐 Segurança

- A rota de atualização de status/comentário deve ser acessível **apenas via token válido**
  (mesma validação da página de visualização)
- O cliente **não pode alterar** nenhum outro campo além de `status` e `comentario_cliente`
- A Profissional não deve conseguir editar `comentario_cliente` pela interface
  (apenas visualizar)

---

## 🧪 Critérios de Aceite

- [ ] O campo de comentário aparece na interface do cliente para conteúdos com status
      `pending_review`, independentemente da ação escolhida (aprovar ou reprovar)
- [ ] O cliente consegue aprovar um conteúdo e deixar um comentário simultaneamente
- [ ] O cliente consegue reprovar um conteúdo e deixar um comentário simultaneamente
- [ ] Se o comentário for deixado em branco, `comentario_cliente` é salvo como `NULL`
- [ ] O comentário é exibido na interface da Profissional no card/detalhe do conteúdo
- [ ] Conteúdos com comentário possuem indicação visual na listagem da Profissional
- [ ] A Profissional não consegue editar o comentário do cliente pela interface
- [ ] A atualização de `status` e `comentario_cliente` ocorre em uma única chamada ao banco

---

## 🧠 Observações Técnicas

- **Suposição:** o modelo atual suporta apenas um comentário por conteúdo (última interação).
  Histórico de comentários é explicitamente fora do escopo e deve ser tratado como
  feature futura separada
- O campo `comentario_cliente` já existe no schema — nenhuma migração necessária
- Seguir o fluxo obrigatório do projeto: `Page → Composable → Service → api.ts → Supabase`
- A atualização pelo cliente passa pela validação de token — nunca expor endpoint
  de update sem validar o token de acesso do calendário pai