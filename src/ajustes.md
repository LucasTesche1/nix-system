## 📄 Contexto

A Profissional precisa compartilhar o roteiro de vídeos do mês com o cliente ou
parceiros de produção em um formato portátil e padronizado.

Atualmente não existe nenhuma funcionalidade de exportação no sistema. Todo o
conteúdo está disponível apenas dentro da interface web, o que torna inviável
o compartilhamento externo sem acesso ao sistema.

**Impacto:** A Profissional perde tempo recriando manualmente documentos de
roteiro em ferramentas externas, aumentando o risco de inconsistências entre
o que está no sistema e o que foi enviado para produção.

---

## 🎯 Objetivo

Permitir que a Profissional exporte, com um clique, um PDF estruturado contendo
todos os conteúdos do tipo **vídeo** de um calendário, organizados por semana,
com todas as informações de roteiro e o link do Drive.

---

## 🧩 Escopo

- Botão "Exportar PDF" na página de detalhes do calendário
- Geração do PDF no frontend com estrutura organizada por semana
- Exportar **apenas** conteúdos do tipo `post` com `formato = 'video'`
- Incluir todas as informações do roteiro: `gancho`, `desenvolvimento`, `cta`,
  `legenda` e `drive_url`
- Nome do arquivo gerado: `Calendario_<mes>_<nome_do_cliente>`

---

## 🚫 Fora do Escopo

- Exportação de stories
- Exportação de posts estáticos ou carrosseis
- Exportação de calendários no formato `.docx`
- Agendamento ou envio automático do PDF por e-mail
- Exportação em lote de múltiplos calendários
- Filtro por status antes de exportar (exporta todos os vídeos independente de status)

---

## ⚙️ Requisitos Técnicos

### Botão de Exportação

- Localização: página de detalhes do calendário, no cabeçalho ou barra de ações
- Label: `Exportar PDF`
- Deve estar disponível apenas para a Profissional (não aparece na view do cliente)
- Durante a geração, exibir estado de loading no botão (`Gerando PDF...`)
- Em caso de erro, exibir toast de erro

### Dados Necessários para o PDF

O service deve buscar, para o calendário em questão:

```
calendarios
  └── nome, mes, ano
      └── clientes
            └── nome
      └── semanas (ordenadas por `ordem`)
            └── nome, ordem
                └── conteudos (tipo = 'post', formato = 'video', deleted_at IS NULL)
                      └── data_publicacao, dia_semana, status
                          └── posts
                                └── legenda, drive_url
                                    └── post_videos
                                          └── gancho, desenvolvimento, cta
```

### Estrutura do PDF

Hierarquia do documento:

```
[Cabeçalho]
Calendário: <nome do calendário>
Cliente: <nome do cliente>
Mês de Referência: <mês por extenso> / <ano>

──────────────────────────────────────

[Semana 1 — <nome da semana>]

  [Conteúdo #1]
  Data: <data_publicacao formatada (ex: 05/07/2025)>
  Dia da semana: <ex: Segunda-feira>

  Gancho:        <gancho>
  Desenvolvimento: <desenvolvimento>
  CTA:           <cta>
  Legenda:       <legenda>
  Link do Drive: <drive_url>

  ──────────────

  [Conteúdo #2]
  ...

[Semana 2 — <nome da semana>]
...
```

### Nome do Arquivo

Padrão: `Calendario_<mes_por_extenso>_<nome_do_cliente>.pdf`

Exemplos:
- `Calendario_Julho_Marca X.pdf`
- `Calendario_Outubro_Studio Y.pdf`

Regras:
- Mês por extenso em português (ex: `Janeiro`, `Fevereiro`)
- Nome do cliente sem normalização (usar como está no banco)
- Separador `_` entre os segmentos

### Biblioteca Sugerida

Utilizar `jsPDF` + `jsPDF-AutoTable` para geração no frontend, sem dependência
de backend ou serviço externo.

---

## 🗄️ Impacto em Dados

Nenhuma alteração de schema necessária.

**Método a implementar em `calendarios.service.ts`:**

- `buscarDadosExportacao(calendario_id)` → retorna calendário com cliente, semanas
  e conteúdos do tipo vídeo com todos os joins necessários, respeitando
  `deleted_at IS NULL` em todas as tabelas

**Tabelas envolvidas (somente leitura):**

| Tabela          | Uso                                          |
|-----------------|----------------------------------------------|
| `calendarios`   | Nome, mês, ano                               |
| `clientes`      | Nome do cliente para título e nome do arquivo |
| `semanas`       | Agrupamento visual, ordenado por `ordem`     |
| `conteudos`     | Filtrado por `tipo = 'post'`, `deleted_at IS NULL` |
| `posts`         | `formato = 'video'`, `legenda`, `drive_url`  |
| `post_videos`   | `gancho`, `desenvolvimento`, `cta`           |

---

## 🔐 Segurança

- O botão de exportação deve ser visível **apenas para a Profissional autenticada**
- A query de exportação deve respeitar as políticas RLS existentes
- `drive_url` deve ser renderizado como texto simples no PDF (não como iframe ou
  link executável embutido)

---

## 🧪 Critérios de Aceite

- [ ] O botão "Exportar PDF" aparece na página de detalhes do calendário para
      a Profissional
- [ ] O botão **não aparece** na interface de visualização do cliente
- [ ] Ao clicar, o PDF é gerado e o download é iniciado automaticamente
- [ ] O PDF contém apenas conteúdos com `formato = 'video'`
- [ ] Stories, posts estáticos e carrosseis **não aparecem** no PDF
- [ ] Os conteúdos estão agrupados por semana, respeitando a ordem das semanas
- [ ] Cada conteúdo exibe: data, dia da semana, gancho, desenvolvimento, CTA,
      legenda e link do Drive
- [ ] O nome do arquivo segue o padrão `Calendario_<mes>_<nome_cliente>.pdf`
- [ ] Se o calendário não tiver nenhum vídeo, exibir toast informativo:
      `"Nenhum vídeo encontrado para exportar"` e não gerar o PDF
- [ ] Durante a geração, o botão exibe estado de loading
- [ ] Em caso de erro na geração, um toast de erro é exibido

---

## 🧠 Observações Técnicas

- **Suposição:** a geração do PDF ocorre inteiramente no frontend — sem endpoint
  dedicado no backend
- **Suposição:** exportar todos os vídeos independentemente do `status`
  (draft, approved, rejected); se houver necessidade de filtrar por status,
  deve ser tratado como escopo futuro
- O join entre `conteudos → posts → post_videos` deve ser feito em uma única
  query com select aninhado (sintaxe PostgREST do Supabase) para evitar N+1
- Seguir o fluxo obrigatório: `Page → Composable → Service → api.ts → Supabase`
- O mês por extenso pode ser derivado do campo `mes` (INT) com um simples mapa
  estático em português — não depender de `Intl` para garantir consistência
````