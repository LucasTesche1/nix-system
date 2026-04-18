import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  ConteudoCompleto, ContentType, PostFormat, DIAS_SEMANA, ContentStatus, STATUS_LABELS,
} from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  calendario: any;
  semanaId: string;
  conteudo?: ConteudoCompleto;
  onSaved: () => void;
}

export const ContentForm = ({ open, onOpenChange, calendario, semanaId, conteudo, onSaved }: Props) => {
  const [tipo, setTipo] = useState<ContentType>("post");
  const [formato, setFormato] = useState<PostFormat>("video");
  const [dataPub, setDataPub] = useState("");
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [legenda, setLegenda] = useState("");
  const [linkDrive, setLinkDrive] = useState("");
  // video
  const [gancho, setGancho] = useState("");
  const [desenvolvimento, setDesenvolvimento] = useState("");
  const [cta, setCta] = useState("");
  // estatico
  const [ideia, setIdeia] = useState("");
  const [imagem, setImagem] = useState("");
  // carrossel
  const [carrIdeia, setCarrIdeia] = useState("");
  const [imagens, setImagens] = useState<string[]>([""]);
  // story
  const [storyTexto, setStoryTexto] = useState("");
  // status
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [saving, setSaving] = useState(false);

  const isEdit = !!conteudo;

  useEffect(() => {
    if (!open) return;
    if (conteudo) {
      setTipo(conteudo.tipo);
      setStatus(conteudo.status);
      setDataPub(conteudo.data_publicacao ?? "");
      setDiaSemana(conteudo.dia_semana ?? 1);
      if (conteudo.tipo === "post" && conteudo.post) {
        setFormato(conteudo.post.formato);
        setLegenda(conteudo.post.legenda ?? "");
        setLinkDrive(conteudo.post.drive_url ?? "");
        if (conteudo.post.video) {
          setGancho(conteudo.post.video.gancho);
          setDesenvolvimento(conteudo.post.video.desenvolvimento);
          setCta(conteudo.post.video.cta);
        }
        if (conteudo.post.estatico) {
          setIdeia(conteudo.post.estatico.ideia);
          setImagem(conteudo.post.estatico.imagem_url);
        }
        if (conteudo.post.carrossel) {
          setCarrIdeia(conteudo.post.carrossel.ideia);
          setImagens(conteudo.post.carrossel.imagens.map((i) => i.imagem_url));
        }
      }
      if (conteudo.story) setStoryTexto(conteudo.story.texto);
    } else {
      setTipo("post"); setFormato("video"); setDataPub(""); setDiaSemana(1);
      setLegenda(""); setLinkDrive(""); setGancho(""); setDesenvolvimento(""); setCta("");
      setIdeia(""); setImagem(""); setCarrIdeia(""); setImagens([""]); setStoryTexto("");
      setStatus("draft");
    }
  }, [open, conteudo]);

  const validate = () => {
    if (tipo === "post") {
      if (!dataPub) return "Data de publicação obrigatória";
      const d = new Date(dataPub);
      if (d.getMonth() + 1 !== calendario.mes || d.getFullYear() !== calendario.ano)
        return "Data deve estar no mês/ano do calendário";
      if (formato === "video" && (!gancho || !desenvolvimento || !cta))
        return "Vídeo: gancho, desenvolvimento e CTA são obrigatórios";
      if (formato === "estatico" && (!ideia || !imagem))
        return "Estático: ideia e imagem são obrigatórios";
      if (formato === "carrossel" && (!carrIdeia || imagens.filter((i) => i.trim()).length === 0))
        return "Carrossel: ideia e ao menos 1 imagem";
    } else {
      if (!storyTexto.trim()) return "Texto do story obrigatório";
      if (diaSemana < 0 || diaSemana > 6) return "Dia da semana inválido";
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      // upsert conteudo
      const conteudoPayload: any = {
        semana_id: semanaId,
        calendario_id: calendario.id,
        tipo,
        data_publicacao: tipo === "post" ? dataPub : null,
        dia_semana: tipo === "story" ? diaSemana : null,
        updated_at: new Date().toISOString(),
      };
      if (isEdit) {
        // versionamento: se aprovado, volta para pending_review
        const newVersion = (conteudo!.version ?? 1) + 1;
        const newStatus = conteudo!.status === "approved" ? "pending_review" : status;
        conteudoPayload.version = newVersion;
        conteudoPayload.status = newStatus;
      } else {
        conteudoPayload.version = 1;
        conteudoPayload.status = status;
      }

      let conteudoId: string;
      if (isEdit) {
        const { error } = await supabase
          .from("conteudos").update(conteudoPayload).eq("id", conteudo!.id);
        if (error) throw error;
        conteudoId = conteudo!.id;
        // limpar filhos antigos
        if (conteudo!.post) {
          await supabase.from("post_videos").delete().eq("post_id", conteudo!.post.id);
          await supabase.from("post_estaticos").delete().eq("post_id", conteudo!.post.id);
          if (conteudo!.post.carrossel) {
            await supabase.from("carrossel_imagens").delete().eq("carrossel_id", conteudo!.post.carrossel.id);
          }
          await supabase.from("post_carrosseis").delete().eq("post_id", conteudo!.post.id);
          await supabase.from("posts").delete().eq("id", conteudo!.post.id);
        }
        if (conteudo!.story) {
          await supabase.from("stories").delete().eq("id", conteudo!.story.id);
        }
      } else {
        const { data, error } = await supabase
          .from("conteudos").insert(conteudoPayload).select().single();
        if (error) throw error;
        conteudoId = data.id;
      }

      if (tipo === "post") {
        const { data: post, error: pe } = await supabase
          .from("posts")
          .insert({ conteudo_id: conteudoId, formato, legenda, drive_url: linkDrive })
          .select().single();
        if (pe) throw pe;
        if (formato === "video") {
          await supabase.from("post_videos")
            .insert({ post_id: post.id, gancho, desenvolvimento, cta });
        } else if (formato === "estatico") {
          await supabase.from("post_estaticos")
            .insert({ post_id: post.id, ideia, imagem_url: imagem });
        } else {
          const { data: carr } = await supabase.from("post_carrosseis")
            .insert({ post_id: post.id, ideia: carrIdeia })
            .select().single();
          const cleanImgs = imagens.filter((i) => i.trim());
          if (carr && cleanImgs.length) {
            await supabase.from("carrossel_imagens").insert(
              cleanImgs.map((url, idx) => ({
                carrossel_id: carr.id, ordem: idx, imagem_url: url,
              }))
            );
          }
        }
      } else {
        await supabase.from("stories")
          .insert({ conteudo_id: conteudoId, texto: storyTexto });
      }
      toast.success(isEdit ? "Conteúdo atualizado" : "Conteúdo criado");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tipo} onValueChange={(v) => setTipo(v as ContentType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 py-2">
          {tipo === "post" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de publicação</Label>
                  <Input
                    type="date"
                    value={dataPub}
                    onChange={(e) => setDataPub(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select value={formato} onValueChange={(v) => setFormato(v as PostFormat)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="estatico">Estático</SelectItem>
                      <SelectItem value="carrossel">Carrossel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formato === "video" && (
                <>
                  <div>
                    <Label>Gancho</Label>
                    <Textarea value={gancho} onChange={(e) => setGancho(e.target.value)} className="mt-1.5" rows={2} />
                  </div>
                  <div>
                    <Label>Desenvolvimento</Label>
                    <Textarea value={desenvolvimento} onChange={(e) => setDesenvolvimento(e.target.value)} className="mt-1.5" rows={4} />
                  </div>
                  <div>
                    <Label>CTA</Label>
                    <Textarea value={cta} onChange={(e) => setCta(e.target.value)} className="mt-1.5" rows={2} />
                  </div>
                </>
              )}

              {formato === "estatico" && (
                <>
                  <div>
                    <Label>Ideia</Label>
                    <Textarea value={ideia} onChange={(e) => setIdeia(e.target.value)} className="mt-1.5" rows={3} />
                  </div>
                  <div>
                    <Label>URL da imagem</Label>
                    <Input value={imagem} onChange={(e) => setImagem(e.target.value)} className="mt-1.5" placeholder="https://…" />
                  </div>
                </>
              )}

              {formato === "carrossel" && (
                <>
                  <div>
                    <Label>Ideia</Label>
                    <Textarea value={carrIdeia} onChange={(e) => setCarrIdeia(e.target.value)} className="mt-1.5" rows={3} />
                  </div>
                  <div>
                    <Label>Imagens (em ordem)</Label>
                    <div className="mt-1.5 space-y-2">
                      {imagens.map((img, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={img}
                            onChange={(e) => setImagens((p) => p.map((x, ix) => ix === i ? e.target.value : x))}
                            placeholder={`Imagem ${i + 1} URL`}
                          />
                          <Button size="icon" variant="ghost" onClick={() => setImagens((p) => p.filter((_, ix) => ix !== i))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => setImagens((p) => [...p, ""])}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar imagem
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>Legenda</Label>
                <Textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} className="mt-1.5" rows={3} />
              </div>
              <div>
                <Label>Link do Drive</Label>
                <Input value={linkDrive} onChange={(e) => setLinkDrive(e.target.value)} className="mt-1.5" placeholder="https://drive.google.com/…" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Dia da semana</Label>
                <Select value={String(diaSemana)} onValueChange={(v) => setDiaSemana(Number(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Texto</Label>
                <Textarea value={storyTexto} onChange={(e) => setStoryTexto(e.target.value)} className="mt-1.5" rows={5} />
              </div>
            </>
          )}

          <div className="border-t pt-4">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && conteudo!.status === "approved" && (
              <p className="mt-2 text-xs text-warning-foreground/80">
                ⚠ Editar um conteúdo aprovado o moverá automaticamente para "Pendente".
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
