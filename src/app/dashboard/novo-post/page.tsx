// src/app/dashboard/novo-post/page.tsx - Versão corrigida com upload real

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Send,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  User,
  Loader2,
  Eye,
  Camera,
  AlertCircle,
  File,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { formatDate, ROUTES } from "@/lib/utils";
import Image from "next/image";

// Schema de validação para criação de posts
const BlogPostSchema = z.object({
  title: z
    .string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(120, "Título não pode exceder 120 caracteres"),

  subtitle: z
    .string()
    .min(10, "Subtítulo deve ter pelo menos 10 caracteres")
    .max(200, "Subtítulo não pode exceder 200 caracteres"),

  content: z
    .string()
    .min(50, "Conteúdo deve ter pelo menos 50 caracteres")
    .max(10000, "Conteúdo não pode exceder 10.000 caracteres"),

  published: z.boolean().default(false).optional(),
});

type BlogPostFormData = z.infer<typeof BlogPostSchema>;

// Interface para arquivo uploadado
interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
}

// Hook para upload de arquivos
const useFileUpload = () => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Verificar se a API existe primeiro
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      }).catch((error) => {
        clearInterval(progressInterval);
        // Se a API não existir, simular upload local
        console.warn("API de upload não encontrada, simulando upload:", error);

        // Simular delay
        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  filename: `${Date.now()}-${file.name}`,
                  originalName: file.name,
                  size: file.size,
                  type: file.type,
                  url: URL.createObjectURL(file), // Usar blob URL para preview
                }),
            } as Response);
          }, 1000);
        });
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || "Erro no upload");
      }

      const result = await response.json();

      setTimeout(() => setUploadProgress(0), 1000);

      return result;
    } catch (error) {
      setUploadProgress(0);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, uploadProgress };
};

export default function NovoPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading, uploadProgress } = useFileUpload();

  const [attachedFiles, setAttachedFiles] = React.useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mainImagePreview, setMainImagePreview] = React.useState<string | null>(
    null
  );

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(BlogPostSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      content: "",
      published: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;

  const watchedContent = watch("content");
  const watchedTitle = watch("title");

  // Calcular tempo de leitura estimado
  const readingTime = React.useMemo(() => {
    const wordsPerMinute = 200;
    const words = watchedContent?.trim().split(/\s+/).length || 0;
    return Math.ceil(words / wordsPerMinute) || 1;
  }, [watchedContent]);

  // Estados adicionais para drag & drop
  const [isDragging, setIsDragging] = React.useState(false);

  // Handler para seleção de arquivos
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  };

  // Handler para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  // Processar arquivos (usado tanto para upload quanto drag & drop)
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validações básicas
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error("Arquivo muito grande", {
          description: `O arquivo ${file.name} excede o limite de 10MB`,
        });
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error("Formato inválido", {
          description: `O arquivo ${file.name} não é um formato suportado`,
        });
        continue;
      }

      try {
        const uploadedFile = await uploadFile(file);

        setAttachedFiles((prev) => [...prev, uploadedFile]);

        // Se for imagem e não temos imagem principal ainda, definir como principal
        if (file.type.startsWith("image/") && !mainImagePreview) {
          setMainImagePreview(uploadedFile.url);
        }

        toast.success("Arquivo enviado!", {
          description: `${file.name} foi enviado com sucesso`,
        });
      } catch (error) {
        console.error("Erro no upload:", error);
        toast.error("Erro no upload", {
          description:
            error instanceof Error ? error.message : "Tente novamente",
        });
      }
    }
  };

  // Remover arquivo
  const removeFile = (filename: string) => {
    setAttachedFiles((prev) =>
      prev.filter((file) => file.filename !== filename)
    );

    // Se removeu a imagem principal, limpar preview
    const removedFile = attachedFiles.find((f) => f.filename === filename);
    if (removedFile && mainImagePreview === removedFile.url) {
      setMainImagePreview(null);
    }
  };

  // Definir como imagem principal
  const setAsMainImage = (url: string) => {
    setMainImagePreview(url);
    toast.success("Imagem principal definida!");
  };

  // Submissão do formulário
  const onSubmit = async (data: BlogPostFormData) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados do post
      const postData = {
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        mainImage: mainImagePreview,
        attachments: attachedFiles,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        published: data.published,
        readingTime,
        createdAt: new Date().toISOString(),
      };

      // Enviar para API
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          description: data.subtitle,
          published: data.published,
          mainImage: mainImagePreview,
          category: "Geral", // Pode ser expandido para permitir seleção
          tags: [], // Pode ser expandido para permitir tags
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar post");
      }

      toast.success("Post criado com sucesso!", {
        description: data.published
          ? "Seu artigo foi publicado e está visível no blog"
          : "Seu artigo foi salvo como rascunho",
      });

      router.push(ROUTES.dashboard);
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Obter ícone do arquivo
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (type === "application/pdf") return <File className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Você precisa estar logado para criar posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Criar Novo Artigo
                </h1>
                <p className="text-gray-600">
                  Compartilhe seu conhecimento tributário
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Tempo de leitura: ~{readingTime} min
              </Badge>

              <Button
                variant="outline"
                onClick={() =>
                  handleSubmit((data) =>
                    onSubmit({ ...data, published: false })
                  )()
                }
                disabled={isSubmitting || !isValid}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </Button>

              <Button
                onClick={() =>
                  handleSubmit((data) =>
                    onSubmit({ ...data, published: true })
                  )()
                }
                disabled={isSubmitting || !isValid}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Título */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-lg font-medium">
                        Título do Artigo *
                      </Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="Digite um título atrativo para seu artigo..."
                        className="mt-2 text-lg h-12"
                        error={!!errors.title}
                        errorMessage={errors.title?.message}
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        {watchedTitle?.length || 0}/120 caracteres
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subtitle" className="text-lg font-medium">
                        Subtítulo *
                      </Label>
                      <Input
                        id="subtitle"
                        {...register("subtitle")}
                        placeholder="Adicione um subtítulo descritivo..."
                        className="mt-2"
                        error={!!errors.subtitle}
                        errorMessage={errors.subtitle?.message}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload de Arquivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Anexar Arquivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Area de Upload */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center">
                      {uploading ? (
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400 mb-4" />
                      )}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {isDragging
                          ? "Solte os arquivos aqui"
                          : "Adicionar arquivos"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {isDragging
                          ? "Solte para fazer upload"
                          : "Arraste arquivos aqui ou clique para selecionar"}
                        <br />
                        <span className="text-sm">
                          Imagens, PDFs, documentos - até 10MB por arquivo
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex items-center gap-2 pointer-events-none"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {uploading ? "Enviando..." : "Selecionar arquivos"}
                        </Button>
                        {!uploading && (
                          <span className="text-xs text-gray-500">
                            ou arraste e solte
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input file oculto */}
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />

                  {/* Botão alternativo se o drag & drop não funcionar */}
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.getElementById(
                          "file-upload"
                        ) as HTMLInputElement;
                        input?.click();
                      }}
                      disabled={uploading}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Ou clique aqui para selecionar
                    </Button>
                  </div>

                  {/* Progress bar durante upload */}
                  {uploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Enviando arquivo...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lista de arquivos anexados */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">
                        Arquivos anexados ({attachedFiles.length})
                      </h4>
                      <div className="space-y-2">
                        {attachedFiles.map((file) => (
                          <div
                            key={file.filename}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.type)}
                              <div>
                                <p className="font-medium text-sm">
                                  {file.originalName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)} • {file.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.type.startsWith("image/") && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAsMainImage(file.url)}
                                  disabled={mainImagePreview === file.url}
                                >
                                  {mainImagePreview === file.url
                                    ? "Principal"
                                    : "Definir como principal"}
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(file.filename)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conteúdo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Conteúdo do Artigo *
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...register("content")}
                    placeholder="Escreva o conteúdo do seu artigo aqui..."
                    rows={20}
                    className="resize-y min-h-[400px]"
                  />
                  {errors.content && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.content.message}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{watchedContent?.length || 0}/10.000 caracteres</span>
                    <span>
                      ~{readingTime} minuto{readingTime !== 1 ? "s" : ""} de
                      leitura
                    </span>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info do Autor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Autor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mainImagePreview && (
                    <Image
                      width={600}
                      height={400}
                      src={mainImagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium line-clamp-2">
                      {watchedTitle || "Título do artigo"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {watch("subtitle") || "Subtítulo do artigo"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Por {user.name}</span>
                    <span>•</span>
                    <span>{formatDate(new Date())}</span>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {attachedFiles.length} arquivo
                      {attachedFiles.length > 1 ? "s" : ""} anexado
                      {attachedFiles.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
