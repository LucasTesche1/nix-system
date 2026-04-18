import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar as CalIcon, ArrowRight, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { MESES } from "@/lib/types";
import { CreateCalendarioDialog } from "@/components/CreateCalendarioDialog";
import { useCalendarios } from "@/hooks/useCalendarios";

const Dashboard = () => {
  const { useCalendariosList } = useCalendarios();
  const { data: rows = [], isLoading, refetch } = useCalendariosList();
  const [open, setOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Seus <span className="text-gradient">calendários</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Crie, gerencie e compartilhe calendários de conteúdo com seus clientes.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary shadow-glow hover:opacity-90">
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/calendario/${r.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:shadow-elevated"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-primary opacity-10 blur-2xl transition group-hover:opacity-20" />
              <div className="relative">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {r.cliente?.nome ?? "—"}
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
                <div className="mt-5 flex items-center text-sm font-medium text-primary">
                  Abrir <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
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
