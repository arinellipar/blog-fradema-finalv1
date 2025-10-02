// src/app/blog/[slug]/page.tsx

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Instagram,
  MessageSquare,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDate, ROUTES } from "@/lib/utils";
import { Comments } from "@/components/blog/comments";
import { UserRole } from "@/types/auth";

// Função para processar o conteúdo e converter para HTML
const processContent = (content: string) => {
  if (!content) return "";

  // Converter quebras de linha duplas para parágrafos
  let processedContent = content
    .replace(/\n\s*\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  // Envolver tudo em parágrafos se não estiver envolto
  if (!processedContent.includes("<p>")) {
    processedContent = `<p>${processedContent}</p>`;
  }

  return processedContent;
};

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

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `${post?.title}\n\n${post?.excerpt || ""}\n\n${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToInstagram = () => {
    // Instagram não permite compartilhamento direto de links via URL
    // Vamos copiar o link e avisar o usuário
    copyToClipboard();
    toast({
      title: "Link copiado para Instagram!",
      description: "Cole este link em sua bio, stories ou direct do Instagram",
    });
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(post?.title || "");
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-16 h-16 text-blue-400" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-blue-200 font-medium"
          >
            Carregando artigo...
          </motion.p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header com Glassmorphism */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/blog")}
                className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </div>

            {/* Stats no Header */}
            <div className="hidden md:flex items-center gap-4 text-sm text-blue-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur">
                <Eye className="w-3.5 h-3.5" />
                <span>{post._count?.views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post._count?.comments || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="relative">
        {/* Imagem Hero com Overlay Gradiente */}
        {post.mainImage && (
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden"
          >
            <Image
              src={post.mainImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

            {/* Animated Overlay Effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent opacity-50" />
              <motion.div
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0"
              />
            </div>
          </motion.div>
        )}

        {/* Content Over Image */}
        <div className="absolute bottom-0 left-0 right-0 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Categorias */}
            {post.categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {post.categories.map(({ category }) => (
                  <Badge
                    key={category.id}
                    className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 text-white px-4 py-1.5 text-sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {category.name}
                  </Badge>
                ))}
              </motion.div>
            )}

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent"
            >
              {post.title}
            </motion.h1>

            {/* Excerpt */}
            {post.excerpt && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-blue-200/90 mb-8 max-w-3xl leading-relaxed"
              >
                {post.excerpt}
              </motion.p>
            )}

            {/* Meta Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              {/* Autor */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-blue-400/50">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {post.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{post.author.name}</p>
                  <p className="text-xs text-blue-300">{post.author.role}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-12 bg-white/10" />

              {/* Data */}
              <div className="flex items-center gap-2 text-blue-200">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
              </div>

              {/* Tempo de leitura */}
              {post.readingTime && (
                <>
                  <Separator
                    orientation="vertical"
                    className="h-12 bg-white/10 hidden sm:block"
                  />
                  <div className="flex items-center gap-2 text-blue-200">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{post.readingTime} min</span>
                  </div>
                </>
              )}

              {/* Trending Icon */}
              <div className="ml-auto hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300 font-medium">
                  Em Alta
                </span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-3 mt-6"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-blue-500/50">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-slate-900/95 backdrop-blur-xl border-white/10"
                >
                  <DropdownMenuItem
                    onClick={shareToWhatsApp}
                    className="text-white hover:bg-white/10"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-green-400" />
                    <span>WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToInstagram}
                    className="text-white hover:bg-white/10"
                  >
                    <Instagram className="w-4 h-4 mr-2 text-pink-400" />
                    <span>Instagram</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={shareToFacebook}
                    className="text-white hover:bg-white/10"
                  >
                    <Facebook className="w-4 h-4 mr-2 text-blue-400" />
                    <span>Facebook</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToTwitter}
                    className="text-white hover:bg-white/10"
                  >
                    <Twitter className="w-4 h-4 mr-2 text-sky-400" />
                    <span>Twitter / X</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={copyToClipboard}
                    className="text-white hover:bg-white/10"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    <span>Copiar link</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                onClick={handleBookmark}
                className="bg-white/5 backdrop-blur border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative"
      >
        {/* Content Card with Light Background */}
        <div className="bg-white rounded-3xl border border-blue-200/20 p-8 md:p-12 shadow-2xl shadow-blue-500/10">
          <div
            className="prose prose-lg max-w-none
            prose-headings:text-slate-900 prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-6
            prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-blue-900
            prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-blue-800
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-4
            prose-a:text-blue-600 prose-a:no-underline prose-a:font-medium hover:prose-a:text-blue-700 hover:prose-a:underline
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-em:text-slate-700
            prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:text-slate-100
            prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-slate-700 prose-blockquote:not-italic
            prose-ul:text-slate-700 prose-ul:my-4
            prose-ol:text-slate-700 prose-ol:my-4
            prose-li:text-slate-700 prose-li:my-2
            prose-li:marker:text-blue-600
            prose-hr:border-slate-200 prose-hr:my-8
            prose-table:text-slate-700
            prose-th:bg-slate-100 prose-th:text-slate-900
            prose-td:border-slate-200"
            dangerouslySetInnerHTML={{
              __html: processContent(
                typeof post.content === "string"
                  ? post.content
                  : String(post.content || "")
              ),
            }}
          />

          {/* Tags Section */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span>Tags:</span>
                </div>
                {post.tags.map(({ tag }) => (
                  <Badge
                    key={tag.id}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer px-3 py-1.5 text-sm font-medium"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16"
        >
          <Comments postId={post.id} postTitle={post.title} />
        </motion.div>
      </motion.article>
    </div>
  );
}
