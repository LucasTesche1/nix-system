import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConteudoService, ConteudoCompleto } from "@/services/conteudo.service";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const useConteudos = () => {
  const queryClient = useQueryClient();

  const useSemanas = (calendarioId: string) => {
    return useQuery({
      queryKey: ["semanas", calendarioId],
      queryFn: () => ConteudoService.getSemanas(calendarioId),
      enabled: !!calendarioId,
    });
  };

  const useConteudosBySemanas = (semanaIds: string[], excludeDraft = false) => {
    return useQuery({
      queryKey: ["conteudos", semanaIds, excludeDraft],
      queryFn: () => ConteudoService.getConteudosBySemanas(semanaIds, excludeDraft),
      enabled: !!semanaIds.length,
    });
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status, comentario }: { id: string; status: Tables<'conteudos'>['status']; comentario?: string }) => 
      ConteudoService.updateStatus(id, status, comentario),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["conteudos"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const softDelete = useMutation({
    mutationFn: ({ table, id }: { table: any; id: string }) => 
      ConteudoService.softDelete(table, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudos"] });
      toast.success("Excluído com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const saveConteudo = useMutation({
    mutationFn: (payload: any) => ConteudoService.save(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conteudos"] });
      toast.success(variables.isEdit ? "Conteúdo atualizado" : "Conteúdo criado");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar conteúdo: " + error.message);
    },
  });

  return {
    useSemanas,
    useConteudosBySemanas,
    updateStatus,
    softDelete,
    saveConteudo,
  };
};
