import { Tables } from "@/integrations/supabase/types";

export type ContentStatus = Tables<'conteudos'>['status'];
export type ContentType = Tables<'conteudos'>['tipo'];
export type PostFormat = Tables<'posts'>['formato'];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Rascunho",
  pending_review: "Pendente",
  approved: "Aprovado",
  rejected: "Reprovado",
};

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
