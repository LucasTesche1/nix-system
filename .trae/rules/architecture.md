# 🏗️ REGRAS DA ARQUITETURA
 
> Leia antes de escrever qualquer linha de código novo.
 
---
 
# 🔁 FLUXO OBRIGATÓRIO
 
```
Componente/Página
      ↓  usa
  Composables   ← nunca chame o Supabase diretamente aqui
      ↓  chama
    Services    ← toda lógica de query fica aqui
      ↓  usa
   api.ts       ← nunca importe supabase fora daqui e dos services
```
 
---
 
# 🚫 PROIBIDO
 
- Nunca importe `supabase` diretamente em páginas ou componentes
- Nunca use `useState` + `useEffect` manual para buscar dados — use `useQuery`
- Nunca ignore silenciosamente o `error` retornado pelo composable
 
---
 
# ✅ OBRIGATÓRIO
 
- Sempre trate o `error` retornado pelo composable