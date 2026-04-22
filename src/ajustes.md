## 📄 Contexto

Campos de texto do sistema (ex: `fluxo` de automações, `legenda` de posts,
`gancho`, `desenvolvimento`, `cta` de vídeos) podem conter quebras de linha
representadas pelo caractere `\n`.

O comportamento padrão do HTML ignora esses caracteres e colapsa o conteúdo
em uma única linha contínua, tornando o texto ilegível quando a formatação
original é relevante para o entendimento do conteúdo.

**Exemplo do problema:**

```
Texto salvo no banco:
"Olá, tudo bem?\nClique no link abaixo:\nhttps://..."

Texto renderizado no browser:
"Olá, tudo bem? Clique no link abaixo: https://..."
```

**Impacto:** A Profissional e o cliente visualizam textos sem formatação, o que
compromete a leitura de roteiros, fluxos de automação e legendas que dependem
de estrutura visual para fazer sentido.

---

## 🎯 Objetivo

Garantir que todos os campos de texto do sistema que possam conter `\n` sejam
renderizados preservando as quebras de linha e espaços originais, de forma
responsiva e sem quebrar o layout.

---

## 🧩 Escopo

- Identificar todos os campos de texto longo renderizados no frontend
- Aplicar a correção de renderização nesses campos
- Garantir que a solução seja responsiva (sem overflow horizontal)

**Campos afetados (mapeamento inicial):**

| Tabela        | Campo            |
|---------------|------------------|
| `post_videos` | `gancho`         |
| `post_videos` | `desenvolvimento`|
| `post_videos` | `cta`            |
| `posts`       | `legenda`        |
| `automacoes`  | `texto` (fluxo)  |
| `stories`     | `texto`          |
| `conteudos`   | `comentario_cliente` |

---

## 🚫 Fora do Escopo

- Suporte a Markdown ou HTML dentro dos campos de texto
- Editor rico (rich text) de criação/edição de conteúdo
- Sanitização de HTML em campos de entrada
- Alteração de schema ou dados no banco

---

## ⚙️ Requisitos Técnicos

### Solução

Aplicar a classe utilitária do Tailwind `whitespace-pre-wrap` nos elementos
que renderizam esses campos:

```tsx
<p className="whitespace-pre-wrap break-words">
  {conteudo.texto}
</p>
```

**Por que `whitespace-pre-wrap`:**
- Preserva `\n` e espaços múltiplos
- Faz wrap automático ao atingir o limite do container (responsivo)
- Não exige manipulação de string no JS

**Por que `break-words`:**
- Evita overflow horizontal em palavras longas sem espaço (ex: URLs)

### O que NÃO fazer

```tsx
// ❌ Não usar — ignora quebras de linha
<p>{texto}</p>

// ❌ Não usar — risco de XSS se o conteúdo vier do usuário
<p dangerouslySetInnerHTML={{ __html: texto.replace(/\n/g, '<br/>') }} />

// ❌ Não usar — whitespace-pre quebra responsividade (sem wrap)
<p className="whitespace-pre">{texto}</p>
```

### Componente Reutilizável (recomendado)

Criar um componente utilitário para centralizar a solução e evitar
inconsistências futuras:

```tsx
// src/components/ui/PreservedText.tsx

interface PreservedTextProps {
  text: string
  className?: string
}

export function PreservedText({ text, className }: PreservedTextProps) {
  return (
    <p className={`whitespace-pre-wrap break-words ${className ?? ''}`}>
      {text}
    </p>
  )
}
```

Substituir todas as ocorrências de renderização dos campos afetados pelo
componente `<PreservedText />`.

---

## 🗄️ Impacto em Dados

Nenhuma alteração de schema ou dados necessária.

O problema é exclusivamente de renderização no frontend.

---

## 🔐 Segurança

- A solução via CSS (`whitespace-pre-wrap`) **não interpreta HTML**, eliminando
  qualquer risco de XSS
- Não utilizar `dangerouslySetInnerHTML` como solução alternativa

---

## 🧪 Critérios de Aceite

- [ ] Textos com `\n` são renderizados com quebra de linha visível na interface
- [ ] Textos com múltiplos espaços preservam os espaços na renderização
- [ ] Nenhum campo corrigido causa overflow horizontal no layout
- [ ] A correção se aplica tanto na interface da Profissional quanto na do cliente
- [ ] Os seguintes campos renderizam corretamente: `gancho`, `desenvolvimento`,
      `cta`, `legenda`, `texto` (stories e automações), `comentario_cliente`
- [ ] O componente `<PreservedText />` é utilizado em todos os campos afetados
- [ ] Não há uso de `dangerouslySetInnerHTML` como solução

---

## 🧠 Observações Técnicas

- A combinação `whitespace-pre-wrap` + `break-words` é a abordagem mais segura
  e simples — não requer manipulação de string nem dependências externas
- Criar o componente `<PreservedText />` como padrão do projeto evita que o
  problema reapareça em novos campos futuros
- Campos de **input/textarea** de criação e edição não são afetados por este bug —
  o problema ocorre apenas na renderização de leitura
- Verificar se há campos afetados dentro de modais de detalhe, cards de listagem
  e na página de visualização do cliente — os três contextos podem renderizar
  esses campos de forma independente
````