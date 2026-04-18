import { supabase } from "./supabase";
import { ConteudoCompleto, ContentStatus } from "./types";

export async function fetchCalendarios() {
  const { data, error } = await supabase
    .from("calendarios")
    .select("*, cliente:clientes(*)")
    .is("deleted_at", null)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCalendarioById(id: string) {
  const { data, error } = await supabase
    .from("calendarios")
    .select("*, cliente:clientes(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCalendarioByToken(token: string) {
  const { data, error } = await supabase
    .from("calendarios")
    .select("*, cliente:clientes(*)")
    .eq("token_acesso", token)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSemanas(calendarioId: string) {
  const { data, error } = await supabase
    .from("semanas")
    .select("*")
    .eq("calendario_id", calendarioId)
    .is("deleted_at", null)
    .order("ordem");
  if (error) throw error;
  return data ?? [];
}

export async function fetchConteudosBySemanas(
  semanaIds: string[],
  excludeDraft = false
): Promise<ConteudoCompleto[]> {
  if (!semanaIds.length) return [];
  let q = supabase
    .from("conteudos")
    .select("*")
    .in("semana_id", semanaIds)
    .is("deleted_at", null);
  if (excludeDraft) q = q.neq("status", "draft");
  const { data: conteudos, error } = await q.order("data_publicacao", {
    ascending: true,
    nullsFirst: false,
  });
  if (error) throw error;
  if (!conteudos?.length) return [];

  const ids = conteudos.map((c) => c.id);

  const [{ data: posts }, { data: stories }] = await Promise.all([
    supabase.from("posts").select("*").in("conteudo_id", ids),
    supabase.from("stories").select("*").in("conteudo_id", ids),
  ]);

  const postIds = posts?.map((p) => p.id) ?? [];
  const [{ data: videos }, { data: estaticos }, { data: carrosseis }] = await Promise.all([
    postIds.length
      ? supabase.from("post_videos").select("*").in("post_id", postIds)
      : Promise.resolve({ data: [] as any[] }),
    postIds.length
      ? supabase.from("post_estaticos").select("*").in("post_id", postIds)
      : Promise.resolve({ data: [] as any[] }),
    postIds.length
      ? supabase.from("post_carrosseis").select("*").in("post_id", postIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const carrIds = carrosseis?.map((c) => c.id) ?? [];
  const { data: imagens } = carrIds.length
    ? await supabase
        .from("carrossel_imagens")
        .select("*")
        .in("carrossel_id", carrIds)
        .order("ordem")
    : { data: [] as any[] };

  return conteudos.map((c) => {
    const post = posts?.find((p) => p.conteudo_id === c.id);
    const story = stories?.find((s) => s.conteudo_id === c.id);
    let postFull;
    if (post) {
      const video = videos?.find((v) => v.post_id === post.id);
      const estatico = estaticos?.find((e) => e.post_id === post.id);
      const carrossel = carrosseis?.find((cr) => cr.post_id === post.id);
      postFull = {
        ...post,
        video,
        estatico,
        carrossel: carrossel
          ? {
              ...carrossel,
              imagens: imagens?.filter((i) => i.carrossel_id === carrossel.id) ?? [],
            }
          : undefined,
      };
    }
    return { ...c, post: postFull, story };
  });
}

export async function updateConteudoStatus(
  id: string,
  status: ContentStatus,
  comentario?: string
) {
  const patch: any = { status, updated_at: new Date().toISOString() };
  if (comentario !== undefined) patch.comentario_cliente = comentario;
  const { error } = await supabase.from("conteudos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function softDelete(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
