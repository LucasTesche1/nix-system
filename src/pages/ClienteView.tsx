import { useState } from "react";
import { useParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarios } from "@/hooks/useCalendarios";
import { useConteudos } from "@/hooks/useConteudos";
import { MESES, DIAS_SEMANA } from "@/lib/types";

const ClienteView = () => {
  const { token = "" } = useParams<{ token: string }>();
  const { useCalendarioByToken } = useCalendarios();
  const { useSemanas, useConteudosBySemanas, updateStatus } = useConteudos();

  const { data: cal, isLoading: loadingCal, error: calError } = useCalendarioByToken(token);
  const { data: semanas = [], isLoading: loadingSemanas } = useSemanas(cal?.id ?? "");
  const semanaIds = semanas.map((s) => s.id);
  const { data: conteudos = [], isLoading: loadingConteudos } = useConteudosBySemanas(semanaIds, true);

  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const handleAct = async (id: string, status: "approved" | "rejected", coment?: string) => {
    updateStatus.mutate({ id, status, comentario: coment });
    setCommentingId(null);
    setComment("");
  };

  if (loadingCal || loadingSemanas || loadingConteudos) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (calError || !cal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="mt-2 text-muted-foreground">Calendário não encontrado ou link inválido.</p>
        </div>
      </div>
    );
  }

  const total = conteudos.length;
  const approved = conteudos.filter((c) => c.status === "approved").length;

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Calendário de conteúdo
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {cal.nome}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {cal.cliente?.nome} · {MESES[cal.mes - 1]} de {cal.ano}
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-sm text-muted-foreground">Progresso de aprovação</div>
              <div className="text-lg font-bold">
                <span className="text-gradient">{approved}</span>
                <span className="text-muted-foreground"> de {total}</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all"
                style={{ width: total ? `${(approved / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {semanas.map((s) => {
          const items = conteudos.filter((c) => c.semana_id === s.id);
          if (!items.length) return null;
          return (
            <section key={s.id} className="mb-12">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-primary opacity-30" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {s.nome ?? `Semana ${s.ordem}`}
                </h2>
                <div className="h-px flex-1 bg-gradient-primary opacity-30" />
              </div>

              <div className="space-y-4">
                {items.map((c) => (
                  <article
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {c.tipo === "post" ? (c.post as any)?.formato : "Story"}
                        </span>
                        <span className="text-sm font-medium">
                          {c.tipo === "post" && c.data_publicacao
                            ? format(parseISO(c.data_publicacao), "EEEE, dd 'de' MMM", { locale: ptBR })
                            : c.tipo === "story" && c.dia_semana !== null
                            ? DIAS_SEMANA[c.dia_semana!]
                            : ""}
                        </span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="space-y-4 p-5">
                      {c.tipo === "story" && (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {c.story?.texto}
                        </p>
                      )}

                      {c.tipo === "post" && (c.post as any)?.formato === "video" && (c.post as any).video && (
                        <div className="space-y-3">
                          <Field label="Gancho" value={(c.post as any).video.gancho} />
                          <Field label="Desenvolvimento" value={(c.post as any).video.desenvolvimento} />
                          <Field label="CTA" value={(c.post as any).video.cta} />
                        </div>
                      )}

                      {c.tipo === "post" && (c.post as any)?.formato === "estatico" && (c.post as any).estatico && (
                        <div className="space-y-3">
                          <Field label="Ideia" value={(c.post as any).estatico.ideia} />
                          {(c.post as any).estatico.imagem_url && (
                            <img src={(c.post as any).estatico.imagem_url} alt="" className="w-full rounded-lg border border-border" />
                          )}
                        </div>
                      )}

                      {c.tipo === "post" && (c.post as any)?.formato === "carrossel" && (c.post as any).carrossel && (
                        <div className="space-y-3">
                          <Field label="Ideia" value={(c.post as any).carrossel.ideia} />
                          {(c.post as any).carrossel.imagens.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {(c.post as any).carrossel.imagens.map((im: any) => (
                                <img
                                  key={im.id}
                                  src={im.imagem_url}
                                  alt=""
                                  className="h-32 w-32 flex-none rounded-lg border border-border object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {(c.post as any)?.legenda && (
                        <Field label="Legenda" value={(c.post as any).legenda} />
                      )}

                      {c.status === "pending_review" && (
                        <div className="mt-8 flex gap-3 border-t border-border/60 pt-6">
                          {commentingId === c.id ? (
                            <div className="w-full space-y-3">
                              <Textarea
                                placeholder="Descreva o que precisa ser ajustado…"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px] rounded-xl"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleAct(c.id, "rejected", comment)}
                                  disabled={!comment.trim() || updateStatus.isPending}
                                >
                                  {updateStatus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                  Confirmar reprovação
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => { setCommentingId(null); setComment(""); }}
                                  disabled={updateStatus.isPending}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAct(c.id, "approved")}
                                disabled={updateStatus.isPending}
                              >
                                <Check className="mr-2 h-4 w-4" /> Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setCommentingId(c.id)}
                                disabled={updateStatus.isPending}
                              >
                                <X className="mr-2 h-4 w-4" /> Solicitar ajustes
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {c.status === "rejected" && c.comentario_cliente && (
                        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100">
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <MessageCircle className="h-3.5 w-3.5" /> Ajustes solicitados
                          </div>
                          {c.comentario_cliente}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
      {label}
    </div>
    <div className="text-[15px] leading-relaxed">{value}</div>
  </div>
);

export default ClienteView;
