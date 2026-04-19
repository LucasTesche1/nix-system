import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MESES } from "@/lib/types";
import { generateToken } from "@/lib/status";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useCalendarios } from "@/hooks/useCalendarios";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export const CreateCalendarioDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const navigate = useNavigate();
  const { useClientes, createCalendario } = useCalendarios();
  const { data: clientes = [] } = useClientes();

  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState<string>("");
  const [novoCliente, setNovoCliente] = useState("");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const submit = async () => {
    if (!nome.trim()) return toast.error("Informe o nome do calendário");
    if (!clienteId && !novoCliente.trim()) return toast.error("Selecione ou crie um cliente");
    
    createCalendario.mutate({
      nome,
      clienteId,
      novoCliente,
      mes,
      ano,
      token: generateToken(),
    }, {
      onSuccess: (cal) => {
        onOpenChange(false);
        onCreated?.();
        navigate(`/calendario/${cal.id}`);
      }
    });
  };

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo calendário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Conteúdo Outubro"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecionar cliente existente…" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!clienteId && (
              <div className="mt-2 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={novoCliente}
                  onChange={(e) => setNovoCliente(e.target.value)}
                  placeholder="ou criar novo cliente…"
                  className="h-9"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mês</Label>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={createCalendario.isPending} className="bg-gradient-primary">
            {createCalendario.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
