import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarioService } from "@/services/calendario.service";
import { toast } from "sonner";

export const useCalendarios = () => {
  const queryClient = useQueryClient();

  const useCalendariosList = () => {
    return useQuery({
      queryKey: ["calendarios"],
      queryFn: () => CalendarioService.getDashboardData(),
    });
  };

  const useCalendario = (id: string) => {
    return useQuery({
      queryKey: ["calendario", id],
      queryFn: () => CalendarioService.getById(id),
      enabled: !!id,
    });
  };

  const useCalendarioByToken = (token: string) => {
    return useQuery({
      queryKey: ["calendario-token", token],
      queryFn: () => CalendarioService.getByToken(token),
      enabled: !!token,
    });
  };

  const deleteCalendario = useMutation({
    mutationFn: (id: string) => CalendarioService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarios"] });
      toast.success("Calendário excluído com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir calendário: " + error.message);
    },
  });

  const addSemana = useMutation({
    mutationFn: ({ calendarioId, ordem, nome }: { calendarioId: string; ordem: number; nome: string }) =>
      CalendarioService.addSemana(calendarioId, ordem, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semanas"] });
      toast.success("Semana adicionada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar semana: " + error.message);
    },
  });

  const updateSemana = useMutation({
    mutationFn: ({ id, nome }: { id: string; nome: string }) =>
      CalendarioService.updateSemana(id, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semanas"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar semana: " + error.message);
    },
  });

  const useClientes = () => {
    return useQuery({
      queryKey: ["clientes"],
      queryFn: () => CalendarioService.getClientes(),
    });
  };

  const createCalendario = useMutation({
    mutationFn: (payload: any) => CalendarioService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarios"] });
      toast.success("Calendário criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar calendário: " + error.message);
    },
  });

  const ativarCalendario = useMutation({
    mutationFn: (id: string) => CalendarioService.ativarCalendario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarios"] });
      queryClient.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Calendário ativado! Link gerado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao ativar calendário: " + error.message);
    },
  });

  return {
    useCalendariosList,
    useCalendario,
    useCalendarioByToken,
    deleteCalendario,
    addSemana,
    updateSemana,
    useClientes,
    createCalendario,
    ativarCalendario,
  };
};
