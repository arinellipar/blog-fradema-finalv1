// src/app/blog/[slug]/page.tsx

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  Share2,
  BookmarkPlus,
  Eye,
  MessageCircle,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDate, ROUTES } from "@/lib/utils";
import { Comments } from "@/components/blog/comments";
import { UserRole } from "@/types/auth";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published: boolean;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  };
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  readingTime?: number;
  wordCount?: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    views: number;
    comments: number;
  };
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { toast } = useToast();

  const [post, setPost] = React.useState<Post | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${slug}`);
      const data = await response.json();

      if (response.ok && data.post) {
        // Validar e sanitizar os dados antes de definir o post
        const sanitizedPost = {
          ...data.post,
          publishedAt: data.post.publishedAt
            ? new Date(data.post.publishedAt)
            : undefined,
          createdAt: new Date(data.post.createdAt),
          updatedAt: new Date(data.post.updatedAt),
          content: data.post.content || "",
          excerpt: data.post.excerpt || "",
          title: data.post.title || "Título não disponível",
        };

        setPost(sanitizedPost);

        // Incrementar contador de visualizações
        incrementViewCount();
      } else {
        toast({
          title: "Post não encontrado",
          description: "O artigo que você está procurando não existe",
          variant: "destructive",
        });
        router.push("/blog");
      }
    } catch (error) {
      console.error("Erro ao carregar post:", error);
      toast({
        title: "Erro ao carregar artigo",
        description: "Não foi possível carregar o conteúdo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      // Registrar visualização na API usando o slug
      await fetch(`/api/posts/${slug}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Erro ao registrar visualização:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiado!",
      description: "O link do artigo foi copiado para a área de transferência",
    });
  };

  const handleBookmark = () => {
    // Implementar lógica de bookmark
    toast({
      title: "Artigo salvo!",
      description: "O artigo foi adicionado aos seus favoritos",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Artigo não encontrado
              </h2>
              <p className="text-muted-foreground mb-4">
                O artigo que você está procurando não existe ou foi removido.
              </p>
              <Button onClick={() => router.push("/blog")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Botões de navegação */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/blog")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Blog
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </Button>
            </div>
          </div>

          {/* Imagem Principal */}
          {post.mainImage && (
            <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden">
              <Image
                src={post.mainImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {/* Categorias */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map(({ category }) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Título */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
          )}

          {/* Meta informações */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* Autor */}
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>
                  {post.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-xs text-gray-500">{post.author.role}</p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Data */}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>

            {/* Tempo de leitura */}
            {post.readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime} min de leitura</span>
              </div>
            )}

            {/* Views */}
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post._count?.views || 0} visualizações</span>
            </div>

            {/* Comentários */}
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post._count?.comments || 0} comentários</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{
            __html:
              typeof post.content === "string"
                ? post.content
                : String(post.content || ""),
          }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-500" />
              {post.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Informações do autor */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>
                  {post.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Sobre {post.author.name}
                </h3>
                <Badge className="mb-2">{post.author.role}</Badge>
                <p className="text-sm text-gray-600">
                  Especialista em consultoria tributária com anos de experiência
                  ajudando empresas a otimizar sua carga fiscal de forma legal e
                  eficiente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de comentários */}
        <div className="mt-12">
          <Comments postId={post.id} postTitle={post.title} />
        </div>
      </article>
    </div>
  );
}
