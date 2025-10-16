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
  Building2,
  Calculator,
  User,
  BarChart3,
  Tags,
  MessageSquare,
  Users,
  Clock,
  Flame,
  Scale,
  ShieldCheck,
  GripVertical,
  Save,
  X as XIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { motion, AnimatePresence } from "framer-motion";
import page from "../page";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  mainImage?: string;
  authorName: string;
  authorAvatar?: string;
  category: string; // Primeira categoria para compatibilidade
  categories?: string[]; // Array de todas as categorias
  publishDate: string;
  order?: number; // ordem vinda do backend (0-n)
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

// Função para truncar texto sem cortar palavras
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  // Encontra o último espaço antes do limite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // Se encontrou um espaço (e não está muito no início), corta ali
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace).trim() + "...";
  }

  // Caso contrário, retorna o texto até o limite sem cortar palavras
  return truncated.trim() + "...";
};

// Mapeamento de ícones e cores para categorias (constante)
const CATEGORY_CONFIGS: Record<string, any> = {
  tributario: {
    icon: Building2,
    gradient: "from-blue-500 via-blue-600 to-indigo-700",
    glowColor: "shadow-blue-500/25",
    hoverGlow: "hover:shadow-blue-500/40",
    accent: "bg-blue-400",
    iconGlow: "shadow-blue-400/50",
  },
  fiscal: {
    icon: Calculator,
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    glowColor: "shadow-emerald-500/25",
    hoverGlow: "hover:shadow-emerald-500/40",
    accent: "bg-emerald-400",
    iconGlow: "shadow-emerald-400/50",
  },
  contabil: {
    icon: BarChart3,
    gradient: "from-orange-500 via-amber-600 to-yellow-600",
    glowColor: "shadow-orange-500/25",
    hoverGlow: "hover:shadow-orange-500/40",
    accent: "bg-orange-400",
    iconGlow: "shadow-orange-400/50",
  },
  legislacao: {
    icon: Scale,
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    glowColor: "shadow-violet-500/25",
    hoverGlow: "hover:shadow-violet-500/40",
    accent: "bg-violet-400",
    iconGlow: "shadow-violet-400/50",
  },
  "reforma-tributaria": {
    icon: Building2,
    gradient: "from-blue-600 via-blue-700 to-indigo-800",
    glowColor: "shadow-blue-600/25",
    hoverGlow: "hover:shadow-blue-600/40",
    accent: "bg-blue-500",
    iconGlow: "shadow-blue-500/50",
  },
  "imposto-renda": {
    icon: Calculator,
    gradient: "from-green-600 via-emerald-700 to-teal-800",
    glowColor: "shadow-green-600/25",
    hoverGlow: "hover:shadow-green-600/40",
    accent: "bg-green-500",
    iconGlow: "shadow-green-500/50",
  },
  "francisco-arrighi": {
    icon: User,
    gradient: "from-purple-600 via-violet-700 to-indigo-800",
    glowColor: "shadow-purple-600/25",
    hoverGlow: "hover:shadow-purple-600/40",
    accent: "bg-purple-500",
    iconGlow: "shadow-purple-500/50",
  },
  "atualizacoes-tributarias": {
    icon: TrendingUp,
    gradient: "from-orange-600 via-red-600 to-pink-700",
    glowColor: "shadow-orange-600/25",
    hoverGlow: "hover:shadow-orange-600/40",
    accent: "bg-orange-500",
    iconGlow: "shadow-orange-500/50",
  },
  planejamento: {
    icon: BarChart3,
    gradient: "from-amber-500 via-orange-600 to-red-600",
    glowColor: "shadow-amber-500/25",
    hoverGlow: "hover:shadow-amber-500/40",
    accent: "bg-amber-400",
    iconGlow: "shadow-amber-400/50",
  },
  compliance: {
    icon: ShieldCheck,
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    glowColor: "shadow-cyan-500/25",
    hoverGlow: "hover:shadow-cyan-500/40",
    accent: "bg-cyan-400",
    iconGlow: "shadow-cyan-400/50",
  },
};

// Função para obter configuração de categoria
const getCategoryConfig = (slug: string) => {
  return (
    CATEGORY_CONFIGS[slug] || {
      icon: Tags,
      gradient: "from-gray-500 via-gray-600 to-gray-700",
      glowColor: "shadow-gray-500/25",
      hoverGlow: "hover:shadow-gray-500/40",
      accent: "bg-gray-400",
      iconGlow: "shadow-gray-400/50",
    }
  );
};

// Componente Sortable Item para drag and drop
interface SortablePostItemProps {
  post: BlogPost;
  onView: (post: BlogPost) => void;
  formatDate: (dateString: string) => string;
  getCategoryColor: (category: string) => string;
  truncateText: (text: string, maxLength: number) => string;
}

function SortablePostItem({
  post,
  onView,
  formatDate,
  getCategoryColor,
  truncateText,
}: SortablePostItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing p-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Post Card */}
      <div className="ml-12 cursor-pointer" onClick={() => onView(post)}>
        <div className="group relative h-full overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl border-2 border-blue-400/50 shadow-2xl shadow-blue-500/20 transition-all duration-500" />

          {/* Animated Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-emerald-500/30 to-violet-500/30 rounded-3xl blur-xl opacity-60 transition-opacity duration-500" />

          <Card className="relative h-full bg-transparent border-0 shadow-none overflow-hidden flex flex-col">
            {post.mainImage && (
              <div className="relative h-56 overflow-hidden flex-shrink-0">
                <img
                  src={post.mainImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
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

            <CardContent className="p-8 flex-1 flex flex-col">
              {!post.mainImage && (
                <div className="flex gap-2 mb-4 flex-wrap">
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

              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors leading-relaxed">
                {truncateText(post.title, 120)}
              </h3>

              <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                {truncateText(post.description, 140)}
              </p>

              <div className="flex items-center justify-between mt-auto">
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
        </div>
      </div>
    </div>
  );
}

export function BlogPostList() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
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

  // Estado para categorias dinâmicas
  const [categories, setCategories] = React.useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(false);

  // Estados para drag and drop (apenas para admins)
  const [isReorderMode, setIsReorderMode] = React.useState(false);
  const [reorderedPosts, setReorderedPosts] = React.useState<BlogPost[]>([]);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);

  // Verificar se o usuário é admin
  const isAdmin = user?.role === UserRole.ADMIN;

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para converter posts da API (memoizada)
  const convertApiPosts = React.useCallback((apiPosts: any[]): BlogPost[] => {
    return apiPosts.map((post: any) => {
      // Extrair todas as categorias do post
      const allCategories =
        post.categories
          ?.map((cat: any) => cat.category?.name)
          .filter(Boolean) || [];

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.excerpt || "",
        content: post.content,
        mainImage: post.mainImage || null,
        authorName: post.author?.name || "Autor desconhecido",
        authorAvatar: post.author?.avatar || null,
        category: allCategories[0] || "Geral", // Primeira categoria para compatibilidade
        categories: allCategories, // Array de todas as categorias
        publishDate: post.publishedAt || post.createdAt,
        order: typeof post.order === "number" ? post.order : undefined,
        readingTime: post.readingTime || 5,
        views: post._count?.PostView || 0,
        commentsCount: post._count?.comments || 0,
        trending: false,
        comments: [], // Array vazio para compatibilidade, mas a contagem está em commentsCount
      };
    });
  }, []);

  // Função para carregar posts (reutilizável)
  const loadPosts = React.useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Se forceRefresh, limpar o cache primeiro
        const url = forceRefresh ? "/api/posts?clearCache=true" : "/api/posts";
        console.log(`🔄 Buscando posts de: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Erro ao buscar posts");
        }

        const apiPosts = await response.json();
        const convertedPosts = convertApiPosts(apiPosts);
        console.log(`✅ ${convertedPosts.length} posts carregados`);

        setPosts(convertedPosts);

        // Se estava em modo de reordenação, limpar também os posts reordenados
        if (forceRefresh) {
          setReorderedPosts([]);
        }
      } catch (err) {
        console.error("❌ Erro ao buscar posts:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [convertApiPosts, setReorderedPosts]
  );

  // Buscar posts da API quando componente montar
  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Buscar categorias da API (memoizado)
  const loadCategories = React.useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }
      const apiCategories = await response.json();
      setCategories(apiCategories);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Atualizar reorderedPosts quando posts mudarem
  React.useEffect(() => {
    if (posts.length > 0 && reorderedPosts.length === 0) {
      setReorderedPosts(posts);
    }
  }, [posts, reorderedPosts.length]);

  // Função para lidar com o fim do drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setReorderedPosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Função para salvar a nova ordem dos posts
  const savePostsOrder = async () => {
    console.log("🔵 Iniciando salvamento da ordem dos posts...");
    setIsSavingOrder(true);

    try {
      const postOrders = reorderedPosts.map((post, index) => ({
        id: post.id,
        order: index,
      }));

      console.log(
        "📦 Dados a enviar:",
        postOrders.slice(0, 3),
        "... (total:",
        postOrders.length,
        ")"
      );

      console.log("🌐 Criando AbortController para timeout...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("⏰ TIMEOUT! Requisição demorou mais de 30 segundos");
        controller.abort();
      }, 30000);

      console.log(
        "🚀 Enviando requisição fetch para /api/admin/posts/reorder..."
      );
      const fetchPromise = fetch("/api/admin/posts/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ postOrders }),
        signal: controller.signal,
      });

      console.log("⏳ Aguardando resposta do servidor...");
      const response = await fetchPromise;
      clearTimeout(timeoutId);

      console.log("✅ Resposta recebida do servidor!");
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      // Tentar ler a resposta como texto primeiro
      const responseText = await response.text();
      console.log(
        "📡 Response text (primeiros 200 chars):",
        responseText.substring(0, 200)
      );

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("❌ Erro ao fazer parse da resposta de erro:", e);
        }
        console.error("❌ Erro na resposta:", errorData);
        throw new Error(errorData.error || "Erro ao salvar ordem dos posts");
      }

      // Tentar fazer parse do JSON
      let result: any = {};
      try {
        result = JSON.parse(responseText);
        console.log("✅ Resposta da API parseada:", result);
      } catch (e) {
        console.error(
          "⚠️ Erro ao fazer parse do JSON, mas resposta foi OK:",
          e
        );
        // Se não conseguir fazer parse mas a resposta foi OK, considerar sucesso
        result = { success: true };
      }

      // Recarregar posts do servidor para garantir que temos a ordem correta
      console.log("🔄 Recarregando posts do servidor com a nova ordem...");
      await loadPosts(true); // Force refresh para limpar cache

      console.log("🔄 Desativando modo de reordenação...");
      setIsReorderMode(false);

      console.log("📢 Mostrando toast de sucesso...");
      toast({
        title: "Ordem salva com sucesso!",
        description: "A ordem dos posts foi atualizada.",
      });

      console.log("✅ Salvamento concluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar ordem:", error);
      console.error(
        "❌ Stack trace:",
        error instanceof Error ? error.stack : "N/A"
      );

      toast({
        title: "Erro ao salvar ordem",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a nova ordem dos posts.",
        variant: "destructive",
      });
    } finally {
      console.log(
        "🏁 Finalizando salvamento (setando isSavingOrder = false)..."
      );
      setIsSavingOrder(false);
      console.log("🏁 Salvamento finalizado!");
    }
  };

  // Função para cancelar reordenação
  const cancelReordering = () => {
    setReorderedPosts(posts);
    setIsReorderMode(false);
  };

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
      filtered = filtered.filter((post) => {
        // Verificar se a categoria selecionada está presente nas categorias do post
        return (
          post.categories?.includes(selectedCategory) ||
          post.category === selectedCategory
        );
      });
    }

    // Ordenação (prioriza a ordem do backend quando existir)
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
        filtered = [...filtered].sort((a, b) => {
          // Se ambos têm order, usa order
          if (typeof a.order === "number" && typeof b.order === "number") {
            return a.order - b.order;
          }
          // Senão, cai no publishedAt/createdAt
          return (
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
          );
        });
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
      // Categorias principais
      Tributário: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      Fiscal: "bg-gradient-to-r from-green-500 to-green-600 text-white",
      Contábil: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
      Legislação: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      "Planejamento Tributário":
        "bg-gradient-to-r from-red-500 to-red-600 text-white",
      // Categorias adicionais
      Compliance: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
      "Reforma Tributária":
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
      "Imposto de Renda":
        "bg-gradient-to-r from-green-600 to-green-700 text-white",
      "Matérias Francisco Arrighi":
        "bg-gradient-to-r from-purple-600 to-purple-700 text-white",
      "Atualizações Tributárias":
        "bg-gradient-to-r from-orange-600 to-orange-700 text-white",
    };
    return (
      colors[category] ||
      "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Lista de posts com filtros e paginação
  return (
    <div className="space-y-8">
      {/* Seções de Categorias Ultra-Modernas 2025 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {categories.slice(0, 4).map((category, index) => {
          const config = getCategoryConfig(category.slug);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              whileTap={{ scale: 0.98 }}
              className={`group cursor-pointer relative overflow-hidden rounded-3xl ${config.glowColor} ${config.hoverGlow} hover:shadow-2xl transition-all duration-500`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20" />

              {/* Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-90`}
              />

              {/* Animated Glow Effect */}
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`}
              />

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {/* Content */}
              <div className="relative z-10 p-6 text-center text-white">
                {/* Icon with Advanced Glow */}
                <div className="relative mb-4 flex justify-center">
                  <div className="relative">
                    {/* Multiple Glow Layers */}
                    <div
                      className={`absolute inset-0 ${config.iconGlow} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <div
                      className={`absolute inset-0 ${config.iconGlow} blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`}
                    />
                    <div
                      className={`absolute inset-0 ${config.iconGlow} blur-lg opacity-20 group-hover:opacity-60 transition-opacity duration-500`}
                    />

                    {/* Icon Container with Glow */}
                    <div className="relative p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-500">
                      <IconComponent
                        className="w-8 h-8 text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Pulsing Ring */}
                    <div
                      className={`absolute inset-0 rounded-2xl border-2 border-white/30 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500`}
                    />
                  </div>

                  {/* Accent Line */}
                  <div
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 ${config.accent} rounded-full blur-sm opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-500`}
                  />
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm leading-tight mb-3 drop-shadow-sm">
                  {category.name}
                </h3>

                {/* Count Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-medium">
                  <div
                    className={`w-2 h-2 ${config.accent} rounded-full mr-2 animate-pulse`}
                  />
                  {category._count?.posts || 0} artigos
                </div>

                {/* Floating Particles */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-ping" />
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filtros e Busca Ultra-Modernos 2025 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        {/* Background com Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-blue-50/40 to-emerald-50/60 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-blue-500/10" />

        {/* Animated Border Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-violet-500/20 rounded-3xl blur-sm opacity-60 animate-pulse" />

        <Card className="relative p-8 bg-transparent border-0 shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Busca Avançada */}
            <div className="md:col-span-2">
              <div className="relative group">
                {/* Icon com Glow */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Search className="w-5 h-5 text-blue-500 group-focus-within:text-emerald-500 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 group-focus-within:opacity-40 transition-opacity duration-300" />
                </div>

                {/* Input com Glassmorphism */}
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/70 backdrop-blur-xl border-2 border-white/30 focus:border-emerald-400/50 focus:bg-white/80 rounded-2xl shadow-lg shadow-blue-500/5 focus:shadow-emerald-500/20 transition-all duration-300 placeholder:text-gray-400 text-gray-700"
                />

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-focus-within:translate-x-full transition-transform duration-1000 rounded-2xl" />
              </div>
            </div>

            {/* Categoria com Efeitos */}
            <div className="relative group">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-white/70 backdrop-blur-xl border-2 border-white/30 focus:border-blue-400/50 rounded-2xl shadow-lg shadow-blue-500/5 hover:shadow-blue-500/20 transition-all duration-300 h-12">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-blue-500" />
                    <SelectValue placeholder="Categoria" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
                  <SelectItem value="all" className="rounded-xl">
                    Todas as categorias
                  </SelectItem>
                  {categories.map((category) => {
                    const config = getCategoryConfig(category.slug);
                    const IconComponent = config.icon;
                    return (
                      <SelectItem
                        key={category.id}
                        value={category.name}
                        className="rounded-xl flex items-center"
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {category.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação com Efeitos */}
            <div className="relative group">
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "recent" | "popular" | "trending")
                }
              >
                <SelectTrigger className="bg-white/70 backdrop-blur-xl border-2 border-white/30 focus:border-violet-400/50 rounded-2xl shadow-lg shadow-violet-500/5 hover:shadow-violet-500/20 transition-all duration-300 h-12">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
                  <SelectItem
                    value="recent"
                    className="rounded-xl flex items-center"
                  >
                    <Clock className="w-4 h-4 mr-2 text-blue-500" /> Mais
                    recentes
                  </SelectItem>
                  <SelectItem
                    value="popular"
                    className="rounded-xl flex items-center"
                  >
                    <Flame className="w-4 h-4 mr-2 text-orange-500" /> Mais
                    populares
                  </SelectItem>
                  <SelectItem
                    value="trending"
                    className="rounded-xl flex items-center"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 text-green-500" /> Em
                    alta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping" />
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-emerald-400/40 rounded-full animate-pulse delay-500" />
        </Card>
      </motion.div>

      {/* Controles de Reordenação (Apenas Admin) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-end gap-4">
            {!isReorderMode ? (
              <Button
                onClick={() => {
                  console.log("🎯 Ativando modo de reordenação");
                  console.log("📊 Posts disponíveis:", posts.length);
                  setIsReorderMode(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <GripVertical className="w-4 h-4 mr-2" />
                Reordenar Posts
              </Button>
            ) : (
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <GripVertical className="w-5 h-5 animate-pulse" />
                  <span className="font-semibold">
                    Modo de Reordenação Ativo
                  </span>
                  <span className="text-xs bg-blue-200 px-2 py-1 rounded-full">
                    {reorderedPosts.length} posts
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={savePostsOrder}
                    disabled={isSavingOrder}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isSavingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Ordem
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={cancelReordering}
                    disabled={isSavingOrder}
                    variant="outline"
                    className="border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Debug Info - Apenas em desenvolvimento */}
          {process.env.NODE_ENV === "development" && isReorderMode && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
              <div className="font-bold mb-2">🔧 Debug Info:</div>
              <div>Posts carregados: {posts.length}</div>
              <div>Posts reordenados: {reorderedPosts.length}</div>
              <div>
                Usuário: {user?.name || "N/A"} ({user?.role || "N/A"})
              </div>
              <div>
                Modo reordenação: {isReorderMode ? "✅ Ativo" : "❌ Inativo"}
              </div>
              <div>Salvando: {isSavingOrder ? "⏳ Sim" : "✅ Não"}</div>
              <div className="mt-2 text-xs text-gray-400">
                💡 Abra o Console do navegador (F12) para ver logs detalhados
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Estatísticas Ultra-Modernas 2025 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {[
          {
            value: filteredAndSortedPosts.length,
            label: "Artigos disponíveis",
            icon: BookOpen,
            gradient: "from-blue-500 to-indigo-600",
            glowColor: "shadow-blue-500/25",
            accentColor: "bg-blue-400",
            iconGlow: "shadow-blue-400/50",
          },
          {
            value: categories.length,
            label: "Categorias",
            icon: Tags,
            gradient: "from-emerald-500 to-teal-600",
            glowColor: "shadow-emerald-500/25",
            accentColor: "bg-emerald-400",
            iconGlow: "shadow-emerald-400/50",
          },
          {
            value: filteredAndSortedPosts.reduce(
              (sum, post) => sum + (post.commentsCount || 0),
              0
            ),
            label: "Comentários",
            icon: MessageSquare,
            gradient: "from-violet-500 to-purple-600",
            glowColor: "shadow-violet-500/25",
            accentColor: "bg-violet-400",
            iconGlow: "shadow-violet-400/50",
          },
          {
            value: filteredAndSortedPosts
              .reduce((sum, post) => sum + (post.views || 0), 0)
              .toLocaleString("pt-BR"),
            label: "Visualizações totais",
            icon: Eye,
            gradient: "from-orange-500 to-amber-600",
            glowColor: "shadow-orange-500/25",
            accentColor: "bg-orange-400",
            iconGlow: "shadow-orange-400/50",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: 0.6 + index * 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className={`group relative overflow-hidden rounded-3xl ${stat.glowColor} hover:shadow-2xl transition-all duration-500`}
          >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-xl border border-white/30" />

            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
            />

            {/* Animated Glow */}
            <div
              className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500`}
            />

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Content */}
            <div className="relative z-10 p-6 text-center">
              {/* Icon with Advanced Glow */}
              <div className="relative mb-4 flex justify-center">
                <div className="relative">
                  {/* Multiple Glow Layers */}
                  <div
                    className={`absolute inset-0 ${stat.iconGlow} blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`}
                  />
                  <div
                    className={`absolute inset-0 ${stat.iconGlow} blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500`}
                  />
                  <div
                    className={`absolute inset-0 ${stat.iconGlow} blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                  />

                  {/* Icon Container */}
                  <div className="relative p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-500">
                    <stat.icon
                      className={`w-6 h-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent drop-shadow-xl group-hover:scale-110 transition-transform duration-300`}
                      strokeWidth={1.5}
                      style={{
                        filter: "drop-shadow(0 0 10px currentColor)",
                        color: "white",
                      }}
                    />
                  </div>

                  {/* Pulsing Ring */}
                  <div className="absolute inset-0 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" />
                </div>
              </div>

              {/* Value */}
              <div
                className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 drop-shadow-sm`}
              >
                {stat.value}
              </div>

              {/* Label */}
              <p className="text-sm font-medium text-gray-600 mb-2">
                {stat.label}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-200/50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${stat.accentColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    duration: 1.5,
                    ease: "easeOut",
                  }}
                />
              </div>

              {/* Floating Dot */}
              <div
                className={`absolute top-3 right-3 w-2 h-2 ${stat.accentColor} rounded-full animate-pulse opacity-60`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Lista de Posts Ultra-Moderna */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl border border-white/40 shadow-2xl" />

            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-violet-500/10 animate-pulse" />

            <div className="relative z-10 p-16 text-center">
              {/* Modern Loading Spinner */}
              <div className="relative mx-auto mb-8 w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-emerald-500 animate-spin">
                  <div className="absolute inset-1 rounded-full bg-white/90 backdrop-blur-sm" />
                </div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 animate-pulse" />
              </div>

              {/* Loading Text */}
              <motion.h3
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3"
              >
                Carregando posts...
              </motion.h3>

              <p className="text-gray-600 max-w-md mx-auto">
                Aguarde enquanto buscamos os artigos mais recentes para você
              </p>

              {/* Loading Dots */}
              <div className="flex justify-center items-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl border border-white/40 shadow-2xl" />

            {/* Error Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10" />

            <div className="relative z-10 p-16 text-center">
              {/* Error Icon with Glow */}
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur-xl opacity-30" />
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-full p-4 shadow-xl">
                  <AlertCircle className="w-12 h-12 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
                Erro ao carregar posts
              </h3>

              <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>

              <Button
                onClick={() => {
                  const loadPosts = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const response = await fetch("/api/posts");
                      const apiPosts = await response.json();
                      setPosts(
                        apiPosts.map((post: any) => ({
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
                          comments: [],
                        }))
                      );
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Erro desconhecido"
                      );
                    } finally {
                      setLoading(false);
                    }
                  };
                  loadPosts();
                }}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Tentar novamente
              </Button>
            </div>
          </motion.div>
        ) : isReorderMode && isAdmin ? (
          // Modo de Reordenação - Mostra todos os posts em uma lista vertical com drag and drop
          <motion.div
            key="reorder-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={reorderedPosts.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {reorderedPosts.map((post) => (
                  <SortablePostItem
                    key={post.id}
                    post={post}
                    onView={async (viewedPost) => {
                      // Registrar visualização
                      try {
                        await fetch(`/api/posts/${viewedPost.id}/view`, {
                          method: "POST",
                        });
                      } catch (error) {
                        console.error("Erro ao registrar visualização:", error);
                      }
                      router.push(`/blog/${viewedPost.slug}`);
                    }}
                    formatDate={formatDate}
                    getCategoryColor={getCategoryColor}
                    truncateText={truncateText}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </motion.div>
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
                <div
                  className="group relative h-full cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2"
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
                  {/* Glassmorphism Background */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl border border-white/30 shadow-2xl shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all duration-500" />

                  {/* Animated Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <Card className="relative h-full bg-transparent border-0 shadow-none overflow-hidden flex flex-col">
                    {post.mainImage && (
                      <div className="relative h-56 overflow-hidden flex-shrink-0">
                        <img
                          src={post.mainImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
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

                    <CardContent className="p-8 flex-1 flex flex-col">
                      {!post.mainImage && (
                        <div className="flex gap-2 mb-4 flex-wrap">
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

                      <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors leading-relaxed">
                        {truncateText(post.title, 120)}
                      </h3>

                      <p className="text-gray-600 mb-6 flex-1 leading-relaxed">
                        {truncateText(post.description, 140)}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.authorAvatar} />
                            <AvatarFallback>
                              {post.authorName[0]}
                            </AvatarFallback>
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
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl border border-white/40 shadow-2xl" />

            {/* Empty State Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-blue-500/5 to-emerald-500/5" />

            <div className="relative z-10 p-16 text-center">
              {/* Empty State Icon with Glow */}
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-blue-300 rounded-full blur-xl opacity-30" />
                <div className="relative bg-gradient-to-r from-gray-400 to-blue-400 rounded-full p-4 shadow-xl">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-blue-600 bg-clip-text text-transparent mb-3">
                Nenhum artigo encontrado
              </h3>

              <p className="text-gray-600 max-w-md mx-auto">
                Tente ajustar os filtros ou fazer uma nova busca para encontrar
                o conteúdo que procura
              </p>

              {/* Floating Particles */}
              <div className="absolute top-8 right-8 w-2 h-2 bg-blue-300/40 rounded-full animate-ping" />
              <div className="absolute bottom-8 left-8 w-1 h-1 bg-gray-300/40 rounded-full animate-pulse delay-300" />
            </div>
          </motion.div>
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
            className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50 hover:scale-110"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
