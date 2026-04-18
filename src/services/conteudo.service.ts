import { api } from "@/lib/api";
import { Tables } from "@/integrations/supabase/types";

export type ConteudoCompleto = Tables<'conteudos'> & {
  post?: (Tables<'posts'> & {
    video?: Tables<'post_videos'>;
    estatico?: Tables<'post_estaticos'>;
    carrossel?: Tables<'post_carrosseis'> & { imagens: Tables<'carrossel_imagens'>[] };
  });
  story?: Tables<'stories'>;
};

export const ConteudoService = {
  async getSemanas(calendarioId: string) {
    const { data, error } = await api
      .from("semanas")
      .select("*")
      .eq("calendario_id", calendarioId)
      .is("deleted_at", null)
      .order("ordem");

    if (error) throw error;
    return data ?? [];
  },

  async getConteudosBySemanas(
    semanaIds: string[],
    excludeDraft = false
  ): Promise<ConteudoCompleto[]> {
    if (!semanaIds.length) return [];
    
    let q = api
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
      api.from("posts").select("*").in("conteudo_id", ids),
      api.from("stories").select("*").in("conteudo_id", ids),
    ]);

    const postIds = posts?.map((p) => p.id) ?? [];
    const [{ data: videos }, { data: estaticos }, { data: carrosseis }] = await Promise.all([
      postIds.length
        ? api.from("post_videos").select("*").in("post_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? api.from("post_estaticos").select("*").in("post_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? api.from("post_carrosseis").select("*").in("post_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const carrIds = carrosseis?.map((c) => c.id) ?? [];
    const { data: imagens } = carrIds.length
      ? await api
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
      return { ...c, post: postFull, story } as ConteudoCompleto;
    });
  },

  async updateStatus(
    id: string,
    status: Tables<'conteudos'>['status'],
    comentario?: string
  ) {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (comentario !== undefined) patch.comentario_cliente = comentario;
    
    // Regra Crítica: Se conteúdo aprovado for editado -> pending_review
    // (Isso deve ser tratado no update de conteúdo, mas aqui é o status)
    
    const { error } = await api.from("conteudos").update(patch).eq("id", id);
    if (error) throw error;
  },

  async softDelete(table: any, id: string) {
    const { error } = await api
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async save(payload: {
    isEdit: boolean;
    conteudoId?: string;
    semanaId: string;
    calendarioId: string;
    tipo: 'post' | 'story';
    status: Tables<'conteudos'>['status'];
    data_publicacao?: string | null;
    dia_semana?: number | null;
    post?: {
      formato: 'video' | 'estatico' | 'carrossel';
      legenda?: string;
      drive_url?: string;
      video?: { gancho: string; desenvolvimento: string; cta: string };
      estatico?: { ideia: string; imagem_url: string };
      carrossel?: { ideia: string; imagens: string[] };
    };
    story?: { texto: string };
    oldConteudo?: ConteudoCompleto;
  }) {
    const { isEdit, conteudoId, semanaId, calendarioId, tipo, status, data_publicacao, dia_semana, post, story, oldConteudo } = payload;

    const conteudoPayload: any = {
      semana_id: semanaId,
      tipo,
      data_publicacao,
      dia_semana,
      updated_at: new Date().toISOString(),
    };

    if (isEdit && oldConteudo) {
      // Regra Crítica: Se conteúdo aprovado for editado -> pending_review
      const newVersion = (oldConteudo.version ?? 1) + 1;
      const newStatus = oldConteudo.status === "approved" ? "pending_review" : status;
      conteudoPayload.version = newVersion;
      conteudoPayload.status = newStatus;
    } else {
      conteudoPayload.version = 1;
      conteudoPayload.status = status;
    }

    let finalConteudoId: string;

    if (isEdit && oldConteudo) {
      const { error } = await api.from("conteudos").update(conteudoPayload).eq("id", oldConteudo.id);
      if (error) throw error;
      finalConteudoId = oldConteudo.id;

      // Limpar relações antigas antes de recriar
      if (oldConteudo.post) {
        const postId = oldConteudo.post.id;
        await api.from("post_videos").delete().eq("post_id", postId);
        await api.from("post_estaticos").delete().eq("post_id", postId);
        if (oldConteudo.post.carrossel) {
          await api.from("carrossel_imagens").delete().eq("carrossel_id", oldConteudo.post.carrossel.id);
        }
        await api.from("post_carrosseis").delete().eq("post_id", postId);
        await api.from("posts").delete().eq("id", postId);
      }
      if (oldConteudo.story) {
        await api.from("stories").delete().eq("id", oldConteudo.story.id);
      }
    } else {
      const { data, error } = await api.from("conteudos").insert(conteudoPayload).select().single();
      if (error) throw error;
      finalConteudoId = data.id;
    }

    if (tipo === "post" && post) {
      const { data: newPost, error: pe } = await api
        .from("posts")
        .insert({ 
          conteudo_id: finalConteudoId, 
          formato: post.formato, 
          legenda: post.legenda, 
          drive_url: post.drive_url 
        })
        .select().single();
      
      if (pe) throw pe;

      if (post.formato === "video" && post.video) {
        await api.from("post_videos").insert({ post_id: newPost.id, ...post.video });
      } else if (post.formato === "estatico" && post.estatico) {
        await api.from("post_estaticos").insert({ post_id: newPost.id, ...post.estatico });
      } else if (post.formato === "carrossel" && post.carrossel) {
        const { data: carr, error: ce } = await api.from("post_carrosseis")
          .insert({ post_id: newPost.id, ideia: post.carrossel.ideia })
          .select().single();
        
        if (ce) throw ce;
        
        const cleanImgs = post.carrossel.imagens.filter((i) => i.trim());
        if (carr && cleanImgs.length) {
          await api.from("carrossel_imagens").insert(
            cleanImgs.map((url, idx) => ({
              carrossel_id: carr.id, ordem: idx, imagem_url: url,
            }))
          );
        }
      }
    } else if (tipo === "story" && story) {
      await api.from("stories").insert({ conteudo_id: finalConteudoId, texto: story.texto });
    }

    return finalConteudoId;
  }
};
