import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchCalendarioByToken, fetchSemanas, fetchConteudosBySemanas, updateConteudoStatus,
} from "@/lib/queries";
import { ConteudoCompleto, MESES, DIAS_SEMANA } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, ExternalLink, Sparkles, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ClienteView = () => {
  const { token } = useParams<{ token: string }>();
  const [cal, setCal] = useState<any>(null);
  const [semanas, setSemanas] = useState<any[]>([]);
  const [conteudos, setConteudos] = useState<ConteudoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const c = await fetchCalendarioByToken(token);
      setCal(c);
      const s = await fetchSemanas(c.id);
      setSemanas(s);
      const cont = await fetchConteudosBySemanas(s.map((x) => x.id), true);
      setConteudos(cont);
    } catch (e: any) {
      setError("Calendário não encontrado ou link inválido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const act = async (id: string, status: "approved" | "rejected", coment?: string) => {
    setBusyId(id);
    try {
      await updateConteudoStatus(id, status, coment);
      setConteudos((p) => p.map((c) => c.id === id ? { ...c, status, comentario_cliente: coment ?? c.comentario_cliente } : c));
      setCommentingId(null);
      setComment("");
      toast.success(status === "approved" ? "Aprovado!" : "Reprovado");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const total = conteudos.length;
  const approved = conteudos.filter((c) => c.status === "approved").length;

  return (
    <div className="min-h-screen bg-background bg-mesh">
      {/* Header */}
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
                  {s.titulo ?? `Semana ${s.ordem}`}
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
                          {c.tipo === "post" ? c.post?.formato : "Story"}
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

                      {c.tipo === "post" && c.post?.formato === "video" && c.post.video && (
                        <div className="space-y-3">
                          <Field label="Gancho" value={c.post.video.gancho} />
                          <Field label="Desenvolvimento" value={c.post.video.desenvolvimento} />
                          <Field label="CTA" value={c.post.video.cta} />
                        </div>
                      )}

                      {c.tipo === "post" && c.post?.formato === "estatico" && c.post.estatico && (
                        <div className="space-y-3">
                          <Field label="Ideia" value={c.post.estatico.ideia} />
                          {c.post.estatico.imagem_url && (
                            <img src={c.post.estatico.imagem_url} alt="" className="w-full rounded-lg border border-border" />
                          )}
                        </div>
                      )}

                      {c.tipo === "post" && c.post?.formato === "carrossel" && c.post.carrossel && (
                        <div className="space-y-3">
                          <Field label="Ideia" value={c.post.carrossel.ideia} />
                          {c.post.carrossel.imagens.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {c.post.carrossel.imagens.map((im) => (
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

                      {c.tipo === "post" && c.post?.legenda && (
                        <Field label="Legenda" value={c.post.legenda} />
                      )}

                      {c.tipo === "post" && c.post?.link_drive && (
                        <a
                          href={c.post.link_drive}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Abrir material
                        </a>
                      )}

                      {c.comentario_cliente && (
                        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <MessageCircle className="h-3 w-3" /> Seu comentário
                          </div>
                          {c.comentario_cliente}
                        </div>
                      )}
                    </div>

                    {c.status === "pending_review" && (
                      <div className="border-t border-border/60 bg-background p-4">
                        {commentingId === c.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Comentário (opcional)…"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm" variant="outline"
                                onClick={() => { setCommentingId(null); setComment(""); }}
                                className="flex-1"
                              >Cancelar</Button>
                              <Button
                                size="sm" onClick={() => act(c.id, "rejected", comment)}
                                disabled={busyId === c.id}
                                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >Reprovar</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm" variant="outline"
                              onClick={() => setCommentingId(c.id)}
                              disabled={busyId === c.id}
                              className="flex-1"
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" /> Reprovar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => act(c.id, "approved")}
                              disabled={busyId === c.id}
                              className="flex-1 bg-gradient-primary text-primary-foreground"
                            >
                              {busyId === c.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Aprovar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {conteudos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">Nenhum conteúdo disponível para revisão ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{value}</p>
  </div>
);

export default ClienteView;
