"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Image,
  User,
  Plus,
  Loader2,
  X,
  CheckCircle,
  Hash,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { CONFIG } from "@/lib/config";

// Categorias padrão
const DEFAULT_CATEGORIES = [
  { id: "geral", name: "Geral", slug: "geral", color: "#6B7280" },
  {
    id: "tributario",
    name: "Tributário",
    slug: "tributario",
    color: "#3B82F6",
  },
  { id: "fiscal", name: "Fiscal", slug: "fiscal", color: "#10B981" },
  { id: "contabil", name: "Contábil", slug: "contabil", color: "#F59E0B" },
  {
    id: "legislacao",
    name: "Legislação",
    slug: "legislacao",
    color: "#8B5CF6",
  },
  {
    id: "planejamento",
    name: "Planejamento",
    slug: "planejamento",
    color: "#EF4444",
  },
];

// Tags sugeridas
const SUGGESTED_TAGS = [
  "ICMS",
  "ISS",
  "PIS/COFINS",
  "Imposto de Renda",
  "Simples Nacional",
  "MEI",
  "Lucro Real",
  "Lucro Presumido",
  "SPED",
  "eSocial",
  "EFD",
  "NFe",
  "CTe",
  "MDFe",
];

interface BlogPostFormData {
  title: string;
  description: string;
  content: string;
  mainImage: string;
  authorName: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  publishDate: string;
  published: boolean;
}

export function BlogPostForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: "",
    description: "",
    content: "",
    mainImage: "",
    authorName: "",
    authorAvatar: "",
    category: "",
    tags: [],
    publishDate: "",
    published: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [charCount, setCharCount] = useState({
    title: 0,
    description: 0,
    content: 0,
  });

  // Inicializa com dados do usuário e data atual
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      publishDate: new Date().toISOString().split("T")[0],
      authorName: user?.name || "",
      authorAvatar: user?.avatar || "",
    }));
  }, [user]);

  // Conta caracteres
  useEffect(() => {
    setCharCount({
      title: formData.title.length,
      description: formData.description.length,
      content: formData.content.length,
    });
  }, [formData.title, formData.description, formData.content]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof BlogPostFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (value: string) => {
    handleInputChange("mainImage", value);
    // Validar se é uma URL válida
    try {
      new URL(value);
      setImagePreview(value);
    } catch {
      setImagePreview(null);
    }
  };

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !formData.tags.includes(normalizedTag)) {
      handleInputChange("tags", [...formData.tags, normalizedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title) {
      toast.error("Título é obrigatório");
      return false;
    }
    if (!formData.description) {
      toast.error("Descrição é obrigatória");
      return false;
    }
    if (!formData.content) {
      toast.error("Conteúdo é obrigatório");
      return false;
    }
    if (!formData.category) {
      toast.error("Categoria é obrigatória");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      console.log("📝 Dados do post:", formData);

      // Simula chamada à API
      const response = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          authorId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar post");
      }

      toast.success("Post criado com sucesso!", {
        description: formData.published
          ? "Seu artigo foi publicado e já está visível no blog."
          : "Seu artigo foi salvo como rascunho.",
      });

      // Reset do formulário
      setFormData({
        title: "",
        description: "",
        content: "",
        mainImage: "",
        authorName: user?.name || "",
        authorAvatar: user?.avatar || "",
        category: "",
        tags: [],
        publishDate: new Date().toISOString().split("T")[0],
        published: true,
      });
      setImagePreview(null);
      setTagInput("");
    } catch (error) {
      console.error("❌ Erro ao criar post:", error);
      toast.error("Erro ao criar post", {
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    setFormData((prev) => ({ ...prev, published: false }));
    handleSubmit();
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Nova Matéria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-base font-semibold">
                Título da Matéria
              </Label>
              <span className="text-xs text-gray-500">
                {charCount.title}/120 caracteres
              </span>
            </div>
            <Input
              id="title"
              placeholder="Digite um título impactante..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              maxLength={120}
              required
              className="text-lg"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-base font-semibold">
                Descrição
              </Label>
              <span className="text-xs text-gray-500">
                {charCount.description}/300 caracteres
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Uma breve descrição que aparecerá na listagem..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              maxLength={300}
              required
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-base font-semibold">
                Conteúdo do Artigo
              </Label>
              <span className="text-xs text-gray-500">
                {charCount.content} caracteres
              </span>
            </div>
            <Textarea
              id="content"
              placeholder="Escreva o conteúdo completo do seu artigo..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={12}
              required
              className="font-mono text-sm"
            />
          </div>

          {/* Imagem Principal */}
          <div className="space-y-2">
            <Label
              htmlFor="mainImage"
              className="flex items-center gap-2 text-base font-semibold"
            >
              <Image className="h-4 w-4" />
              Imagem Principal (URL)
            </Label>
            <Input
              id="mainImage"
              type="url"
              placeholder="https://exemplo.com/imagem.jpg"
              value={formData.mainImage}
              onChange={(e) => handleImageChange(e.target.value)}
            />
            {imagePreview && (
              <div className="mt-2 relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={() => setImagePreview(null)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    handleInputChange("mainImage", "");
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Categoria e Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tags"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Hash className="h-4 w-4" />
                Tags
              </Label>
              <div className="space-y-2">
                <Input
                  id="tags"
                  placeholder="Digite e pressione Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_TAGS.filter((tag) => !formData.tags.includes(tag))
                    .slice(0, 5)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleAddTag(tag)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tags selecionadas */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Data e Preview do Autor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="publishDate"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Calendar className="h-4 w-4" />
                Data de Publicação
              </Label>
              <Input
                id="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={(e) =>
                  handleInputChange("publishDate", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Preview do Autor
              </Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={formData.authorAvatar}
                    alt={formData.authorName}
                  />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {formData.authorName || "Autor"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(
                      formData.publishDate || Date.now()
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => {
                setFormData((prev) => ({ ...prev, published: true }));
                handleSubmit();
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Publicar Artigo
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Salvar como Rascunho
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
