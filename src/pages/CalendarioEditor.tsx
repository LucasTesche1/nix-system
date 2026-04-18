import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Share2, Copy, Check, Loader2, Trash2, Pencil } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { ContentForm } from "@/components/ContentForm";
import { MESES, DIAS_SEMANA } from "@/lib/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarios } from "@/hooks/useCalendarios";
import { useConteudos } from "@/hooks/useConteudos";
import { ConteudoCompleto } from "@/services/conteudo.service";

const CalendarioEditor = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { useCalendario, addSemana, updateSemana } = useCalendarios();
  const { useSemanas, useConteudosBySemanas, softDelete: deleteItem } = useConteudos();

  const { data: cal, isLoading: loadingCal } = useCalendario(id);
  const { data: semanas = [], isLoading: loadingSemanas } = useSemanas(id);
  const semanaIds = semanas.map((s) => s.id);
  const { data: conteudos = [], isLoading: loadingConteudos } = useConteudosBySemanas(semanaIds);

  const [copied, setCopied] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ semanaId: string; conteudo?: ConteudoCompleto } | null>(null);

  const handleAddSemana = async () => {
    const ordem = (semanas[semanas.length - 1]?.ordem ?? 0) + 1;
    addSemana.mutate({ calendarioId: id, ordem, nome: `Semana ${ordem}` });
  };

  const handleRenameSemana = async (sid: string, nome: string) => {
    updateSemana.mutate({ id: sid, nome });
  };

  const handleRemoveSemana = async (sid: string) => {
    if (!confirm("Excluir esta semana? Os conteúdos também serão removidos.")) return;
    deleteItem.mutate({ table: "semanas", id: sid });
    const cIds = conteudos.filter((c) => c.semana_id === sid).map((c) => c.id);
    for (const cid of cIds) deleteItem.mutate({ table: "conteudos", id: cid });
  };

  const handleRemoveConteudo = async (cid: string) => {
    if (!confirm("Excluir este conteúdo?")) return;
    deleteItem.mutate({ table: "conteudos", id: cid });
  };

  const copyLink = () => {
    if (!cal) return;
    const url = `${window.location.origin}/c/${cal.token_acesso}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingCal || loadingSemanas || !cal) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link to="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Calendários
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {cal.cliente?.nome}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{cal.nome}</h1>
          <p className="mt-1 text-muted-foreground">
            {MESES[cal.mes - 1]} de {cal.ano}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLink}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copiar link do cliente
          </Button>
          <Button asChild className="bg-gradient-primary">
            <a href={`/c/${cal.token_acesso}`} target="_blank" rel="noreferrer">
              <Share2 className="mr-2 h-4 w-4" /> Abrir visão do cliente
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {semanas.map((s) => {
          const items = conteudos.filter((c) => c.semana_id === s.id);
          return (
            <section key={s.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Input
                  defaultValue={s.nome ?? ""}
                  onBlur={(e) => handleRenameSemana(s.id, e.target.value)}
                  className="max-w-xs border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveSemana(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setEditing({ semanaId: s.id }); setFormOpen(true); }}
                    className="bg-gradient-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar conteúdo
                  </Button>
                </div>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  Nenhum conteúdo nesta semana
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((c) => (
                    <div key={c.id} className="group rounded-xl border border-border bg-background p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                              {c.tipo === "post" ? (c.post as any)?.formato ?? "post" : "story"}
                            </span>
                            <StatusBadge status={c.status} />
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {c.tipo === "post" && c.data_publicacao
                              ? format(parseISO(c.data_publicacao), "EEEE, dd/MM", { locale: ptBR })
                              : c.tipo === "story" && c.dia_semana !== null
                              ? DIAS_SEMANA[c.dia_semana!]
                              : "Sem data"}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => { setEditing({ semanaId: s.id, conteudo: c }); setFormOpen(true); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveConteudo(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-sm">
                        {c.tipo === "story"
                          ? c.story?.texto
                          : (c.post as any)?.formato === "video"
                          ? (c.post as any)?.video?.gancho
                          : (c.post as any)?.formato === "estatico"
                          ? (c.post as any)?.estatico?.ideia
                          : (c.post as any)?.carrossel?.ideia}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <Button
          variant="outline"
          onClick={handleAddSemana}
          className="w-full border-dashed border-border py-8 text-muted-foreground hover:bg-secondary/50"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Semana
        </Button>
      </div>

      <ContentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        semanaId={editing?.semanaId ?? ""}
        conteudo={editing?.conteudo}
        onSaved={() => {}}
      />
    </AdminLayout>
  );
};

export default CalendarioEditor;
