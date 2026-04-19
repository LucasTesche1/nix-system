import { api } from "@/lib/api";
import { Tables } from "@/integrations/supabase/types";

export type CalendarioComCliente = Tables<'calendarios'> & {
  cliente: Tables<'clientes'> | null;
  progress?: number;
};

export const CalendarioService = {
  async getAll(): Promise<CalendarioComCliente[]> {
    const { data, error } = await api
      .from("calendarios")
      .select("*, cliente:clientes(*)")
      .is("deleted_at", null)
      .order("ano", { ascending: false })
      .order("mes", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  },

  async getById(id: string) {
    const { data, error } = await api
      .from("calendarios")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    return data;
  },

  async getByToken(token: string) {
    const { data, error } = await api
      .from("calendarios")
      .select("*, cliente:clientes(*)")
      .eq("token_acesso", token)
      .is("deleted_at", null)
      .single();

    if (error || !data) throw new Error("Link inválido");

    if (data.status !== 'active') {
      throw new Error("Calendário ainda não está ativo");
    }

    if (data.token_expiracao && new Date(data.token_expiracao) < new Date()) {
      throw new Error("Link expirado");
    }

    return data;
  },

  async ativarCalendario(id: string) {
    const token = crypto.randomUUID();
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + 7);

    const { error } = await api
      .from("calendarios")
      .update({
        status: 'active',
        token_acesso: token,
        token_expiracao: expiracao.toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    return { token, expiracao };
  },

  async getDashboardData(): Promise<CalendarioComCliente[]> {
    const cals = await this.getAll();
    const ids = cals.map((c) => c.id);
    
    if (!ids.length) return [];

    // Lógica de progresso movida da UI para o Service
    const { data: sem } = await api
      .from("semanas")
      .select("id, calendario_id")
      .in("calendario_id", ids)
      .is("deleted_at", null);

    const semIds = sem?.map((s) => s.id) ?? [];
    
    const { data: cont } = semIds.length
      ? await api
          .from("conteudos")
          .select("status, semana_id")
          .in("semana_id", semIds)
          .neq("status", "draft")
          .is("deleted_at", null)
      : { data: [] as any[] };

    const semToCal = new Map(sem?.map((s) => [s.id, s.calendario_id]));
    const tally: Record<string, { tot: number; ok: number }> = {};
    
    cont?.forEach((c) => {
      const cid = semToCal.get(c.semana_id)!;
      tally[cid] ??= { tot: 0, ok: 0 };
      tally[cid].tot++;
      if (c.status === "approved") tally[cid].ok++;
    });

    return cals.map((c) => ({
      ...c,
      progress: tally[c.id]?.tot ? Math.round((tally[c.id].ok / tally[c.id].tot) * 100) : 0,
    }));
  },

  async softDelete(id: string) {
    const { error } = await api
      .from("calendarios")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async addSemana(calendarioId: string, ordem: number, nome: string) {
    const { error } = await api
      .from("semanas")
      .insert({ calendario_id: calendarioId, ordem, nome });
    if (error) throw error;
  },

  async updateSemana(id: string, nome: string) {
    const { error } = await api
      .from("semanas")
      .update({ nome })
      .eq("id", id);
    if (error) throw error;
  },

  async getClientes() {
    const { data, error } = await api
      .from("clientes")
      .select("id, nome")
      .is("deleted_at", null)
      .order("nome");
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: {
    nome: string;
    clienteId?: string;
    novoCliente?: string;
    mes: number;
    ano: number;
    token: string;
  }) {
    let cid = payload.clienteId;
    if (!cid && payload.novoCliente) {
      const { data, error } = await api
        .from("clientes")
        .insert({ nome: payload.novoCliente.trim() })
        .select()
        .single();
      if (error) throw error;
      cid = data.id;
    }

    if (!cid) throw new Error("Cliente não informado");

    const { data: cal, error } = await api
      .from("calendarios")
      .insert({
        cliente_id: cid,
        nome: payload.nome.trim(),
        mes: payload.mes,
        ano: payload.ano,
        status: 'draft',
        token_acesso: payload.token,
      })
      .select()
      .single();

    if (error) throw error;

    // create 4 default semanas
    await api.from("semanas").insert(
      [1, 2, 3, 4].map((o) => ({
        calendario_id: cal.id,
        ordem: o,
        nome: `Semana ${o}`,
      }))
    );

    return cal;
  }
};
