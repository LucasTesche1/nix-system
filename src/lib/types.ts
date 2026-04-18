export type ContentStatus = "draft" | "pending_review" | "approved" | "rejected";
export type ContentType = "post" | "story";
export type PostFormat = "video" | "estatico" | "carrossel";

export interface Cliente {
  id: string;
  nome: string;
  created_at?: string;
  deleted_at?: string | null;
}

export interface Calendario {
  id: string;
  cliente_id: string;
  nome: string;
  mes: number;
  ano: number;
  token_acesso: string;
  created_at?: string;
  deleted_at?: string | null;
  cliente?: Cliente;
}

export interface Semana {
  id: string;
  calendario_id: string;
  ordem: number;
  titulo: string | null;
  deleted_at?: string | null;
}

export interface Conteudo {
  id: string;
  semana_id: string;
  tipo: ContentType;
  status: ContentStatus;
  version: number;
  data_publicacao: string | null;
  dia_semana: number | null;
  comentario_cliente: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Post {
  id: string;
  conteudo_id: string;
  formato: PostFormat;
  legenda: string | null;
  link_drive: string | null;
}

export interface PostVideo {
  id: string;
  post_id: string;
  gancho: string;
  desenvolvimento: string;
  cta: string;
}

export interface PostEstatico {
  id: string;
  post_id: string;
  ideia: string;
  imagem_url: string;
}

export interface PostCarrossel {
  id: string;
  post_id: string;
  ideia: string;
}

export interface CarrosselImagem {
  id: string;
  carrossel_id: string;
  ordem: number;
  imagem_url: string;
}

export interface Story {
  id: string;
  conteudo_id: string;
  dia_semana: number;
  texto: string;
}

export interface ConteudoCompleto extends Conteudo {
  post?: (Post & {
    video?: PostVideo;
    estatico?: PostEstatico;
    carrossel?: PostCarrossel & { imagens: CarrosselImagem[] };
  });
  story?: Story;
}

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
