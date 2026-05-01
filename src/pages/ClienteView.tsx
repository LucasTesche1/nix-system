import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarioService } from "@/services/calendario.service";
import { ConteudoService } from "@/services/conteudo.service";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { MESES, DIAS_SEMANA } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PreservedText } from "@/components/ui/PreservedText";

const ClienteView = () => {
  const { token = "" } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (token) {
      api.setClientToken(token);
    }
    return () => api.setClientToken(null);
  }, [token]);

  const { data: cal, isLoading: loadingCal, error: calError } = useQuery({
    queryKey: ["calendario-token", token],
    queryFn: () => CalendarioService.getByToken(token),
    enabled: !!token,
  });

  const { data: semanas = [], isLoading: loadingSemanas } = useQuery({
    queryKey: ["semanas", cal?.id ?? ""],
    queryFn: () => ConteudoService.getSemanas(cal!.id),
    enabled: !!cal?.id,
  });

  const semanaIds = useMemo(() => semanas.map((s) => s.id), [semanas]);

  const { data: conteudos = [], isLoading: loadingConteudos } = useQuery({
    queryKey: ["conteudos", semanaIds, true],
    queryFn: () => ConteudoService.getConteudosBySemanas(semanaIds, true),
    enabled: !!semanaIds.length,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, comentario }: { id: string; status: Tables<'conteudos'>['status']; comentario?: string }) =>
      ConteudoService.updateStatus(id, status, comentario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudos"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const [comments, setComments] = useState<Record<string, string>>({});

  const { total, approved } = useMemo(() => ({
    total: conteudos.length,
    approved: conteudos.filter((c) => c.status === "approved").length
  }), [conteudos]);

  const handleAct = async (id: string, status: "approved" | "rejected") => {
    const coment = comments[id] || "";
    updateStatus.mutate({ id, status, comentario: coment });
    // Limpar comentário local após sucesso se desejar, mas o mutate já vai invalidar a query
  };

  if (loadingCal || loadingSemanas || loadingConteudos) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (calError || !cal) {
    const errorMsg = calError instanceof Error ? calError.message : "Link inválido";
    const subMsg = errorMsg === "Link expirado" 
      ? "Este link de visualização expirou. Solicite um novo link."
      : errorMsg === "Calendário ainda não está ativo"
      ? "Este calendário está sendo preparado e ainda não foi liberado para visualização."
      : "Calendário não encontrado ou link inválido.";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <div className="text-center px-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/50">
            <X className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{errorMsg}</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-sm mx-auto">{subMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Calendário de conteúdo
          </div>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {cal.nome}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {cal.cliente?.nome} · {MESES[cal.mes - 1]} de {cal.ano}
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-card p-4 sm:mt-6">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <div className="text-xs text-muted-foreground sm:text-sm">Progresso de aprovação</div>
              <div className="text-base font-bold sm:text-lg">
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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {semanas.map((s) => {
          const items = conteudos.filter((c) => c.semana_id === s.id);
          if (!items.length) return null;
          return (
            <section key={s.id} className="mb-10 sm:mb-12">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-primary opacity-30" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-secondary/30 px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                        <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {c.tipo === "post" 
                            ? (c.post as any)?.formato 
                            : c.tipo === "story" 
                            ? "Story" 
                            : "Automação"}
                        </span>
                        <span className="truncate text-xs font-medium sm:text-sm">
                          {c.tipo === "post" && c.data_publicacao
                            ? format(parseISO(c.data_publicacao), "EEEE, dd 'de' MMM", { locale: ptBR })
                            : c.tipo === "story" && c.dia_semana !== null
                            ? DIAS_SEMANA[c.dia_semana!]
                            : c.tipo === "automacoes"
                            ? c.automacoes?.titulo
                            : ""}
                        </span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                      {c.tipo === "story" && (
                        <PreservedText 
                          text={c.story?.texto ?? ""} 
                          className="text-[15px] leading-relaxed" 
                        />
                      )}

                      {c.tipo === "automacoes" && (
                        <div className="space-y-3">
                          <Field label="Fluxo" value={c.automacoes?.texto ?? ""} />
                        </div>
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
                        <div className="mt-8 space-y-4 border-t border-border/60 pt-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                              Feedback (Opcional)
                            </label>
                            <Textarea
                              placeholder="Deixe um comentário para a equipe (opcional)"
                              value={comments[c.id] ?? ""}
                              onChange={(e) => setComments(p => ({ ...p, [c.id]: e.target.value }))}
                              className="min-h-[80px] rounded-xl bg-secondary/20 focus:bg-background transition-colors"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              onClick={() => handleAct(c.id, "approved")}
                              disabled={updateStatus.isPending}
                            >
                              {updateStatus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleAct(c.id, "rejected")}
                              disabled={updateStatus.isPending}
                            >
                              {updateStatus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                              Solicitar ajustes
                            </Button>
                          </div>
                        </div>
                      )}

                      {c.comentario_cliente && c.status !== "pending_review" && (
                        <div className={cn(
                          "mt-4 rounded-xl p-4 text-sm border transition-colors",
                          c.status === "rejected" 
                            ? "bg-red-50 text-red-800 border-red-100" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-100"
                        )}>
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <MessageCircle className="h-3.5 w-3.5" /> 
                            {c.status === "rejected" ? "Ajustes solicitados" : "Comentário da aprovação"}
                          </div>
                          <PreservedText text={c.comentario_cliente} />
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
    <PreservedText text={value} className="text-[15px] leading-relaxed" />
  </div>
);

export default ClienteView;

