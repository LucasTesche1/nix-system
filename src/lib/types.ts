import { Tables } from "@/integrations/supabase/types";

export type ContentStatus = Tables<'conteudos'>['status'];
export type CalendarStatus = Tables<'calendarios'>['status'];
export type ContentType = Tables<'conteudos'>['tipo'];
export type PostFormat = Tables<'posts'>['formato'];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Rascunho",
  pending_review: "Pendente",
  approved: "Aprovado",
  published: "Publicado",
  rejected: "Reprovado",
};

export const APPROVED_LIKE_STATUSES: ContentStatus[] = ["approved", "published"];

export const isApprovedLikeStatus = (status: ContentStatus) =>
  APPROVED_LIKE_STATUSES.includes(status);

export const CALENDAR_STATUS_LABELS: Record<CalendarStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
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
