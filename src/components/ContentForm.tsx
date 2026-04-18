import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ContentType, PostFormat, ContentStatus,
} from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { useConteudos } from "@/hooks/useConteudos";
import { useCalendarios } from "@/hooks/useCalendarios";
import { ConteudoCompleto } from "@/services/conteudo.service";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  semanaId: string;
  conteudo?: ConteudoCompleto;
  onSaved: () => void;
}

export const ContentForm = ({ open, onOpenChange, semanaId, conteudo, onSaved }: Props) => {
  const { saveConteudo } = useConteudos();
  const { useCalendario } = useCalendarios();
  
  // Precisamos do calendário para validar a data
  const [calendarioId, setCalendarioId] = useState<string>("");
  const { data: calendario } = useCalendario(calendarioId);

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

  const isEdit = !!conteudo;

  useEffect(() => {
    if (conteudo) {
      // Aqui assumimos que o conteúdo tem o calendario_id ou conseguimos via semana
      // Para simplificar, vamos garantir que o ID do calendário esteja disponível
    }
  }, [conteudo]);

  useEffect(() => {
    if (!open) return;
    if (conteudo) {
      setTipo(conteudo.tipo as ContentType);
      setStatus(conteudo.status as ContentStatus);
      setDataPub(conteudo.data_publicacao ?? "");
      setDiaSemana(conteudo.dia_semana ?? 1);
      if (conteudo.tipo === "post" && conteudo.post) {
        setFormato(conteudo.post.formato as PostFormat);
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
      // Validação de data contra o calendário se necessário
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

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);

    const payload: any = {
      isEdit,
      semanaId,
      calendarioId: conteudo?.calendario_id || "", // Precisamos garantir esse ID
      tipo,
      status,
      data_publicacao: tipo === "post" ? dataPub : null,
      dia_semana: tipo === "story" ? diaSemana : null,
      oldConteudo: conteudo,
    };

    if (tipo === "post") {
      payload.post = {
        formato,
        legenda,
        drive_url: linkDrive,
        video: formato === "video" ? { gancho, desenvolvimento, cta } : undefined,
        estatico: formato === "estatico" ? { ideia, imagem_url: imagem } : undefined,
        carrossel: formato === "carrossel" ? { ideia: carrIdeia, imagens } : undefined,
      };
    } else {
      payload.story = { texto: storyTexto };
    }

    saveConteudo.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSaved();
      }
    });
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
                    <Label>Ideia do post</Label>
                    <Textarea value={ideia} onChange={(e) => setIdeia(e.target.value)} className="mt-1.5" rows={3} />
                  </div>
                  <div>
                    <Label>URL da Imagem/Referência</Label>
                    <Input value={imagem} onChange={(e) => setImagem(e.target.value)} className="mt-1.5" />
                  </div>
                </>
              )}

              {formato === "carrossel" && (
                <>
                  <div>
                    <Label>Ideia do carrossel</Label>
                    <Textarea value={carrIdeia} onChange={(e) => setCarrIdeia(e.target.value)} className="mt-1.5" rows={3} />
                  </div>
                  <div className="space-y-3">
                    <Label>Imagens do carrossel</Label>
                    {imagens.map((img, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={img}
                          onChange={(e) => setImagens(p => p.map((v, i) => i === idx ? e.target.value : v))}
                          placeholder={`Imagem ${idx + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setImagens(p => p.filter((_, i) => i !== idx))}
                          disabled={imagens.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImagens(p => [...p, ""])}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar imagem
                    </Button>
                  </div>
                </>
              )}

              <div>
                <Label>Legenda</Label>
                <Textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} className="mt-1.5" rows={4} />
              </div>

              <div>
                <Label>Link do Drive (Opcional)</Label>
                <Input value={linkDrive} onChange={(e) => setLinkDrive(e.target.value)} className="mt-1.5" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Dia da semana</Label>
                <Select value={String(diaSemana)} onValueChange={(v) => setDiaSemana(Number(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Texto do Story</Label>
                <Textarea value={storyTexto} onChange={(e) => setStoryTexto(e.target.value)} className="mt-1.5" rows={6} />
              </div>
            </>
          )}

          {!isEdit && (
            <div>
              <Label>Status inicial</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho (invisível ao cliente)</SelectItem>
                  <SelectItem value="pending_review">Pendente (enviar para revisão)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saveConteudo.isPending}
            className="bg-gradient-primary"
          >
            {saveConteudo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar alterações" : "Criar conteúdo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
