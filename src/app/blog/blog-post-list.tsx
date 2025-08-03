"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  ClockIcon,
  MessageCircleIcon,
  UserIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  BookOpen,
  ArrowUp,
  AlertCircle,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { BLOG_CATEGORIES } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  mainImage?: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  publishDate: string;
  readingTime?: number;
  views?: number;
  commentsCount?: number;
  trending?: boolean;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  date: string;
  replies?: Comment[];
}

const POSTS_PER_PAGE = 6;

export function BlogPostList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(
    "recent"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Estado para posts reais
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Buscar posts da API quando componente montar
  React.useEffect(() => {
    console.log("🔄 useEffect executado");
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/posts");

        if (!response.ok) {
          throw new Error("Erro ao buscar posts");
        }

        const apiPosts = await response.json();

        // Converter posts da API para o formato esperado pelo componente
        const convertedPosts: BlogPost[] = apiPosts.map((post: any) => {
          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            description: post.excerpt || "",
            content: post.content,
            mainImage: post.mainImage || null,
            authorName: post.author?.name || "Autor desconhecido",
            authorAvatar: post.author?.avatar || null,
            category: post.tags?.[0]?.tag?.name || "Geral",
            publishDate: post.publishedAt || post.createdAt,
            readingTime: post.readingTime || 5,
            views: post._count?.PostView || 0,
            commentsCount: post._count?.comments || 0,
            trending: false,
            comments: [], // Array vazio para compatibilidade, mas a contagem está em commentsCount
          };
        });

        setPosts(convertedPosts);
      } catch (err) {
        console.error("❌ Erro ao buscar posts:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Monitora scroll para botão "voltar ao topo"
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filtragem e ordenação
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Ordenação
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort(
          (a, b) => (b.views || 0) - (a.views || 0)
        );
        break;
      case "trending":
        filtered = [...filtered].filter((post) => post.trending);
        break;
      case "recent":
      default:
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        );
    }

    return filtered;
  }, [posts, searchTerm, selectedCategory, sortBy]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredAndSortedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Tributário: "bg-blue-100 text-blue-800",
      Fiscal: "bg-green-100 text-green-800",
      Contábil: "bg-yellow-100 text-yellow-800",
      Legislação: "bg-purple-100 text-purple-800",
      Planejamento: "bg-red-100 text-red-800",
      Compliance: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Lista de posts com filtros e paginação
  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categoria */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {BLOG_CATEGORIES.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "recent" | "popular" | "trending")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="trending">Em alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {filteredAndSortedPosts.length}
          </div>
          <p className="text-sm text-gray-600">Artigos disponíveis</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {BLOG_CATEGORIES.length}
          </div>
          <p className="text-sm text-gray-600">Categorias</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {filteredAndSortedPosts.reduce(
              (sum, post) => sum + post.comments.length,
              0
            )}
          </div>
          <p className="text-sm text-gray-600">Comentários</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {filteredAndSortedPosts
              .reduce((sum, post) => sum + (post.views || 0), 0)
              .toLocaleString("pt-BR")}
          </div>
          <p className="text-sm text-gray-600">Visualizações totais</p>
        </Card>
      </div>

      {/* Lista de Posts */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Carregando posts...
            </h3>
            <p className="text-gray-600">
              Aguarde enquanto buscamos os artigos mais recentes
            </p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Erro ao carregar posts
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                console.log("🔄 Testando busca manual...");
                const loadPosts = async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    const response = await fetch("/api/posts");
                    const apiPosts = await response.json();
                    console.log("📝 Posts recebidos:", apiPosts.length);
                    setPosts(
                      apiPosts.map((post: any) => ({
                        id: post.id,
                        title: post.title,
                        description: post.excerpt || "",
                        content: post.content,
                        mainImage: post.mainImage || null,
                        authorName: post.author?.name || "Autor desconhecido",
                        authorAvatar: post.author?.avatar || null,
                        category: post.tags?.[0]?.tag?.name || "Geral",
                        publishDate: post.publishedAt || post.createdAt,
                        readingTime: post.readingTime || 5,
                        views: post._count?.PostView || 0,
                        commentsCount: post._count?.comments || 0,
                        trending: false,
                        comments: [],
                      }))
                    );
                  } catch (err) {
                    console.error("❌ Erro:", err);
                    setError(
                      err instanceof Error ? err.message : "Erro desconhecido"
                    );
                  } finally {
                    setLoading(false);
                  }
                };
                loadPosts();
              }}
              variant="outline"
            >
              Tentar novamente
            </Button>
          </Card>
        ) : paginatedPosts.length > 0 ? (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Card
                  className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden"
                  onClick={async () => {
                    // Registrar visualização
                    try {
                      await fetch(`/api/posts/${post.id}/view`, {
                        method: "POST",
                      });
                    } catch (error) {
                      console.error("Erro ao registrar visualização:", error);
                    }

                    // Navegar para a página individual do post usando slug
                    router.push(`/blog/${post.slug}`);
                  }}
                >
                  {post.mainImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.mainImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                        {post.trending && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Em alta
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {!post.mainImage && (
                      <div className="flex gap-2 mb-3">
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                        {post.trending && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Em alta
                          </Badge>
                        )}
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.authorAvatar} />
                          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {post.authorName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(post.publishDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {post.readingTime && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{post.readingTime}m</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MessageCircleIcon className="w-4 h-4" />
                          <span>{post.commentsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum artigo encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou fazer uma nova busca
            </p>
          </Card>
        )}
      </AnimatePresence>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Mostra apenas algumas páginas
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 py-1">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Botão de voltar ao topo */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
