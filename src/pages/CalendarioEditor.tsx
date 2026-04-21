import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Share2, Copy, Check, Loader2, Trash2, Pencil, Calendar, ShieldCheck, AlertCircle, MessageCircle, FileDown } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { ContentForm } from "@/components/ContentForm";
import { MESES, DIAS_SEMANA, CALENDAR_STATUS_LABELS } from "@/lib/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarios } from "@/hooks/useCalendarios";
import { useConteudos } from "@/hooks/useConteudos";
import { ConteudoCompleto } from "@/services/conteudo.service";
import { cn } from "@/lib/utils";

const CalendarioEditor = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { useCalendario, addSemana, updateSemana, ativarCalendario, registrarAcesso, exportarPDF } = useCalendarios();
  const { useSemanas, useConteudosBySemanas, softDelete: deleteItem } = useConteudos();

  useEffect(() => {
    if (id) {
      registrarAcesso.mutate(id);
    }
  }, [id]);

  const { data: cal, isLoading: loadingCal } = useCalendario(id);
  const { data: semanas = [], isLoading: loadingSemanas } = useSemanas(id);
  const semanaIds = semanas.map((s) => s.id);
  const { data: conteudos = [], isLoading: loadingConteudos } = useConteudosBySemanas(semanaIds);

  const [copied, setCopied] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ semanaId: string; conteudo?: ConteudoCompleto } | null>(null);

  const handleExportPDF = async () => {
    try {
      const data = await exportarPDF.mutateAsync(id);
      if (!data) return toast.error("Calendário não encontrado");

      const semanasComVideo = (data as any).semanas?.filter((s: any) => 
        s.conteudos?.some((c: any) => c.post?.formato === 'video')
      ) || [];
      
      if (semanasComVideo.length === 0) {
        return toast.info("Nenhum vídeo encontrado para exportar");
      }

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;

      // Marca d'água / Header "Agência Nix"
      doc.setTextColor(255, 123, 44); // #ff792c85
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Agência Nix", 105, y, { align: "center" });
      y += 12;

      // Cabeçalho Principal
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Roteiros de Vídeo", 105, y, { align: "center" });
      y += 12;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${(data as any).cliente?.nome || 'N/A'}`, margin, y);
      y += 7;
      doc.text(`Mês de Referência: ${MESES[data.mes - 1]} / ${data.ano}`, margin, y);
      y += 10;
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
      y += 15;

      semanasComVideo.forEach((semana: any) => {
        const videosDaSemana = semana.conteudos.filter((c: any) => c.post?.formato === 'video');
        if (videosDaSemana.length === 0) return;

        // Título da Semana
        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`[Semana ${semana.ordem} — ${semana.nome || `Semana ${semana.ordem}`}]`, margin, y);
        y += 12;

        videosDaSemana.forEach((conteudo: any, cIdx: number) => {
          if (y > 230) { doc.addPage(); y = margin; }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`Conteúdo #${cIdx + 1}`, margin + 5, y);
          y += 7;

          doc.setFont("helvetica", "normal");
          const dataFormatada = conteudo.data_publicacao 
            ? format(parseISO(conteudo.data_publicacao), "dd/MM/yyyy")
            : "Sem data";
          
          doc.text(`Data: ${dataFormatada}`, margin + 10, y);
          y += 10;

          // Acessando os dados do vídeo (gancho, desenvolvimento, cta)
          // Verificando se vem como array ou objeto único (tabela post_videos)
          const videoData = Array.isArray(conteudo.post?.post_videos) 
            ? conteudo.post.post_videos[0] 
            : conteudo.post?.post_videos;
          
          const drawField = (label: string, value: string | null | undefined) => {
            if (!value) return;
            if (y > 260) { doc.addPage(); y = margin; }
            doc.setFont("helvetica", "bold");
            doc.text(`${label}:`, margin + 10, y);
            doc.setFont("helvetica", "normal");
            
            const lines = doc.splitTextToSize(value, 140);
            doc.text(lines, margin + 45, y);
            y += (lines.length * 6) + 4;
          };

          drawField("Gancho", videoData?.gancho);
          drawField("Desenvolvimento", videoData?.desenvolvimento);
          drawField("CTA", videoData?.cta);
          drawField("Legenda", conteudo.post?.legenda);
          drawField("Link do Drive", conteudo.post?.drive_url);

          y += 5;
          doc.setDrawColor(220);
          doc.line(margin + 10, y, 100, y);
          y += 15;
        });

        y += 5;
      });

      const fileName = `Calendario_${MESES[data.mes - 1]}_${(data as any).cliente?.nome || 'Cliente'}.pdf`;
      doc.save(fileName);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF");
    }
  };

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
    if (!cal || !cal.token_acesso) return;
    const url = `${window.location.origin}/c/${cal.token_acesso}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAtivar = () => {
    if (cal?.status === 'active' && !confirm("O calendário já está ativo. Deseja regenerar o token e renovar a expiração por mais 7 dias?")) {
      return;
    }
    ativarCalendario.mutate(id);
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

  const isExpired = cal.token_expiracao && new Date(cal.token_expiracao) < new Date();

  return (
    <AdminLayout>
      <Link to="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Calendários
      </Link>

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {cal.cliente?.nome}
            </div>
            <div className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              cal.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
            )}>
              {CALENDAR_STATUS_LABELS[cal.status as keyof typeof CALENDAR_STATUS_LABELS] || cal.status}
            </div>
          </div>
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight md:text-3xl">{cal.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {MESES[cal.mes - 1]} de {cal.ano}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {cal.status === 'active' && cal.token_acesso ? (
              <>
                <Button variant="outline" onClick={copyLink} className="shadow-sm">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copiar link
                </Button>
                <Button asChild variant="outline" className="shadow-sm">
                  <a href={`/c/${cal.token_acesso}`} target="_blank" rel="noreferrer">
                    <Share2 className="mr-2 h-4 w-4" /> Visualizar
                  </a>
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportarPDF.isPending}
              className="shadow-sm"
            >
              {exportarPDF.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {exportarPDF.isPending ? "Gerando PDF..." : "Exportar PDF"}
            </Button>
            <Button 
              onClick={handleAtivar} 
              disabled={ativarCalendario.isPending}
              className={cn(
                "shadow-glow transition-all",
                cal.status === 'active' ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-gradient-primary"
              )}
            >
              {ativarCalendario.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : cal.status === 'active' ? (
                <ShieldCheck className="mr-2 h-4 w-4" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              {cal.status === 'active' ? "Renovar acesso" : "Ativar calendário"}
            </Button>
          </div>

          {cal.status === 'active' && cal.token_expiracao && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isExpired ? "text-destructive" : "text-muted-foreground"
            )}>
              {isExpired ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
              {isExpired ? "Link expirado" : `Expira em ${format(parseISO(cal.token_expiracao), "dd/MM 'às' HH:mm")}`}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {semanas.map((s) => {
          const items = conteudos.filter((c) => c.semana_id === s.id);
          return (
            <section key={s.id} className="rounded-2xl border border-border bg-card p-4 md:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  defaultValue={s.nome ?? ""}
                  onBlur={(e) => handleRenameSemana(s.id, e.target.value)}
                  className="max-w-xs border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
                />
                <div className="flex gap-2 sm:flex-none">
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveSemana(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setEditing({ semanaId: s.id }); setFormOpen(true); }}
                    className="flex-1 bg-gradient-primary sm:flex-none"
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((c) => (
                    <div key={c.id} className="group rounded-xl border border-border bg-background p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                              {c.tipo === "post"
                                ? (c.post as any)?.formato ?? "post"
                                : c.tipo === "story"
                                ? "story"
                                : "automação"}
                            </span>
                            <StatusBadge status={c.status} />
                            {c.comentario_cliente && (
                              <MessageCircle className="h-4 w-4 text-primary animate-pulse" />
                            )}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {c.tipo === "post" && c.data_publicacao
                              ? format(parseISO(c.data_publicacao), "EEEE, dd/MM", { locale: ptBR })
                              : c.tipo === "story" && c.dia_semana !== null
                              ? DIAS_SEMANA[c.dia_semana!]
                              : "Sem data"}
                          </div>
                        </div>
                        <div className="flex flex-none gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
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
                          : c.tipo === "automacoes"
                          ? `${c.automacoes?.titulo}: ${c.automacoes?.texto}`
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
        calendarioId={id}
        conteudo={editing?.conteudo}
        onSaved={() => {}}
      />
    </AdminLayout>
  );
};

export default CalendarioEditor;
