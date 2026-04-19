import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar as CalIcon, ArrowRight, Loader2, Calendar, ShieldCheck, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { MESES, CALENDAR_STATUS_LABELS } from "@/lib/types";
import { CreateCalendarioDialog } from "@/components/CreateCalendarioDialog";
import { useCalendarios } from "@/hooks/useCalendarios";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { useCalendariosList, deleteCalendario } = useCalendarios();
  const { data: rows = [], isLoading, refetch } = useCalendariosList();
  const [open, setOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este calendário? Esta ação não pode ser desfeita.")) {
      deleteCalendario.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Seus <span className="text-gradient">calendários</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Crie, gerencie e compartilhe calendários de conteúdo com seus clientes.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="w-full bg-gradient-primary shadow-glow hover:opacity-90 md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Criar calendário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <CalIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum calendário ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie seu primeiro calendário para começar.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-6 bg-gradient-primary">
            <Plus className="mr-2 h-4 w-4" /> Criar primeiro
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/calendario/${r.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:shadow-elevated"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-primary opacity-10 blur-2xl transition group-hover:opacity-20" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {r.cliente?.nome ?? "—"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    r.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                  )}>
                    {r.status === 'active' ? <ShieldCheck className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                    {CALENDAR_STATUS_LABELS[r.status as keyof typeof CALENDAR_STATUS_LABELS] || r.status}
                  </div>
                </div>
                <h3 className="mt-2 text-xl font-bold tracking-tight">{r.nome}</h3>
                <div className="mt-1 text-sm text-muted-foreground">
                  {MESES[r.mes - 1]} de {r.ano}
                </div>
                <div className="mt-6">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Aprovação</span>
                    <span className="font-medium">{r.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-gradient-primary transition-all"
                      style={{ width: `${r.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center text-primary">
                    Abrir <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDelete(e, r.id)}
                    disabled={deleteCalendario.isPending}
                  >
                    {deleteCalendario.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateCalendarioDialog open={open} onOpenChange={setOpen} onCreated={() => refetch()} />
    </AdminLayout>
  );
};

export default Dashboard;
