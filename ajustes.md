````markdown
# [Feature] Substituir prévia de imagem por link clicável na visualização do cliente

## 📄 Contexto

Atualmente, a interface do cliente renderiza uma prévia (preview) da imagem
inserida pela Profissional nos posts do tipo `estatico` e nos slides de carrossel.

Esse comportamento gera problemas práticos:
- Links de drives (Google Drive, Dropbox, etc.) não retornam uma imagem direta,
  quebrando o preview
- Imagens externas podem não carregar por restrições de CORS ou expiração de URL
- O preview consome espaço visual desnecessário na interface do cliente

**Impacto:** A interface do cliente exibe imagens quebradas ou em branco com
frequência, transmitindo falta de qualidade na entrega da Profissional.

---

## 🎯 Objetivo

Substituir a renderização de prévia de imagem na interface do cliente por um
ícone clicável que redirecione para o link inserido pela Profissional, mantendo
a interface da Profissional exatamente como está.

---

## 🧩 Escopo

- Remover a renderização de `<img>` na visualização do cliente para os campos
  de imagem dos posts
- Exibir um ícone de imagem clicável no lugar do preview
- Ao clicar no ícone, abrir o link em uma nova aba
- Aplicar a mudança nos dois contextos que possuem imagem: `post_estaticos`
  e `carrossel_imagens`

---

## 🚫 Fora do Escopo

- Qualquer alteração na interface da Profissional
- Alteração de como o link é inserido ou validado
- Preview de vídeo ou de outros tipos de mídia
- Alteração de schema ou campos no banco

---

## ⚙️ Requisitos Técnicos

### Comportamento Atual (apenas na view do cliente)

```tsx
// ❌ Comportamento atual — será removido da view do cliente
<img src={imagem_url} alt="preview" />
```

### Comportamento Esperado (view do cliente)

```tsx
// ✅ Substituir por ícone clicável
<a href={imagem_url} target="_blank" rel="noopener noreferrer">
  <ImageIcon />
</a>
```

### Especificações do Ícone

- Utilizar ícone de imagem disponível na lib `lucide-react` já presente no projeto:
  `import { ImageIcon } from 'lucide-react'`
- O ícone deve ter tamanho adequado para ser clicável (mínimo `24x24px`)
- Deve ter aparência de elemento interativo (cursor pointer, hover visível)
- Exibir tooltip ou label `"Ver imagem"` ao passar o mouse

### Contextos Afetados

| Tabela             | Campo        | Contexto                        |
|--------------------|-------------|----------------------------------|
| `post_estaticos`   | `imagem_url` | Card de post estático (cliente) |
| `carrossel_imagens`| `imagem_url` | Slides de carrossel (cliente)   |

### Segurança do Link Externo

- Sempre abrir em `target="_blank"`
- Sempre incluir `rel="noopener noreferrer"` para evitar acesso ao contexto
  da página original

---

## 🗄️ Impacto em Dados

Nenhuma alteração de schema necessária.

A mudança é exclusivamente na camada de renderização do frontend.

---

## 🔐 Segurança

- Não renderizar a URL como HTML diretamente (`dangerouslySetInnerHTML`)
- Usar `rel="noopener noreferrer"` em todos os links externos
- Não tentar validar ou reescrever a URL no frontend — renderizar como recebida
  do banco

---

## 🧪 Critérios de Aceite

- [ ] Na interface do cliente, posts estáticos **não exibem** preview de imagem
- [ ] Na interface do cliente, slides de carrossel **não exibem** preview de imagem
- [ ] Um ícone de imagem é exibido no lugar do preview em ambos os contextos
- [ ] Ao clicar no ícone, o link abre em uma nova aba
- [ ] O link abre com `rel="noopener noreferrer"`
- [ ] O ícone exibe tooltip `"Ver imagem"` ao passar o mouse
- [ ] O ícone possui cursor pointer e feedback visual de hover
- [ ] A interface da Profissional **não sofre nenhuma alteração**
- [ ] Quando `imagem_url` é `NULL` ou vazio, o ícone **não é renderizado**

---

## 🧠 Observações Técnicas

- A alteração deve ser feita **exclusivamente nos componentes da view do cliente**;
  os componentes da Profissional não devem ser tocados
- Verificar se os componentes de post estático e carrossel são compartilhados
  entre as duas views — se sim, a distinção deve ser feita via prop
  (ex: `mode="client" | "admin"`) para não duplicar componentes
- `lucide-react@0.383.0` já está disponível no projeto — não adicionar dependências
- Caso `imagem_url` esteja presente mas o link seja inválido, o comportamento
  é de responsabilidade do destino do link; o sistema não deve tentar validar
  a URL antes de renderizar o ícone
````