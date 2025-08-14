// src/components/admin/posts-management.tsx

"use client";

import * as React from "react";
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  TrendingUp,
  Calendar,
  User,
  BarChart3,
  RefreshCw,
  Download,
  Globe,
  AlertTriangle,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  readingTime?: number;
  wordCount?: number;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  commentsCount: number;
  approvedCommentsCount: number;
  pendingCommentsCount: number;
  views: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
  engagement: {
    avgTimeOnPage: number;
    bounceRate: number;
    shareCount: number;
  };
}

interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  totalViews: number;
  avgViewsPerPost: number;
}

interface PostsManagementProps {
  currentUserId: string;
  isLoading?: boolean;
}

interface EditPostData {
  title: string;
  excerpt: string;
  published: boolean;
}

type DialogType = "edit" | "delete" | "view" | "analytics";

export function PostsManagement({
  currentUserId,
  isLoading: initialLoading = false,
}: PostsManagementProps) {
  const { toast } = useToast();

  // Estados do componente
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stats, setStats] = React.useState<PostStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
    approvedComments: 0,
    pendingComments: 0,
    totalViews: 0,
    avgViewsPerPost: 0,
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [authorFilter, setAuthorFilter] = React.useState<string>("all");
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<DialogType>("edit");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [editData, setEditData] = React.useState<EditPostData>({
    title: "",
    excerpt: "",
    published: false,
  });

  // Carregar posts
  const loadPosts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/posts", {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        const postsData = data.posts.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        }));

        setPosts(postsData);
        setStats(data.stats);
      } else {
        throw new Error(data.error?.message || "Erro ao carregar posts");
      }
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar posts na inicialização
  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Filtrar posts
  const filteredPosts = React.useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "draft" && !post.published);

      const matchesAuthor =
        authorFilter === "all" || post.author.id === authorFilter;

      return matchesSearch && matchesStatus && matchesAuthor;
    });
  }, [posts, searchTerm, statusFilter, authorFilter]);

  // Obter autores únicos para filtro
  const authors = React.useMemo(() => {
    const uniqueAuthors = posts.reduce((acc, post) => {
      if (!acc.find((author) => author.id === post.author.id)) {
        acc.push(post.author);
      }
      return acc;
    }, [] as Array<{ id: string; name: string }>);
    return uniqueAuthors;
  }, [posts]);

  // Handlers de ação
  const openDialog = (type: DialogType, post: Post) => {
    setSelectedPost(post);
    setDialogType(type);

    if (type === "edit") {
      setEditData({
        title: post.title,
        excerpt: post.excerpt || "",
        published: post.published,
      });
    }

    setDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPost || !editData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (response.ok) {
        await loadPosts(); // Recarregar posts

        toast({
          title: "Post atualizado",
          description: "As informações do post foram atualizadas com sucesso",
          variant: "default",
        });

        setDialogOpen(false);
      } else {
        throw new Error(data.error?.message || "Erro ao atualizar post");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (
    postId: string,
    published: boolean
  ) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadPosts(); // Recarregar posts
        toast({
          title: "Status atualizado",
          description: `Post ${
            published ? "publicado" : "despublicado"
          } com sucesso`,
          variant: "default",
        });
      } else {
        throw new Error(
          data.error?.message || "Erro ao alterar status do post"
        );
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPost) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        await loadPosts(); // Recarregar posts
        toast({
          title: "Post removido",
          description: "O post foi removido do sistema com sucesso",
          variant: "default",
        });
        setDeleteConfirmOpen(false);
      } else {
        throw new Error(data.error?.message || "Erro ao remover post");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const exportPosts = () => {
    const csvContent = [
      [
        "Título",
        "Status",
        "Autor",
        "Categoria",
        "Visualizações",
        "Comentários",
        "Data de Criação",
        "Data de Publicação",
      ],
      ...filteredPosts.map((post) => [
        post.title,
        post.published ? "Publicado" : "Rascunho",
        post.author.name,
        post.categories.map((c) => c.name).join(", ") || "Sem categoria",
        post.views.total.toString(),
        post.commentsCount.toString(),
        formatDate(post.createdAt),
        post.publishedAt ? formatDate(post.publishedAt) : "Não publicado",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posts-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Lista de posts exportada com sucesso",
      variant: "default",
    });
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Gerenciamento de Posts
          </h2>
          <p className="text-gray-600">
            Gerencie posts, visualizações e estatísticas de engajamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadPosts}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportPosts} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Publicados</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.publishedPosts}
                </p>
              </div>
              <Globe className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Visualizações</p>
                <p className="text-2xl font-bold">
                  {formatViews(stats.totalViews)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comentários</p>
                <p className="text-2xl font-bold">{stats.totalComments}</p>
                <p className="text-xs text-gray-500">
                  {stats.pendingComments} pendentes
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por título ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por autor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os autores</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Posts do Sistema
            <Badge variant="secondary" className="ml-auto">
              {filteredPosts.length} posts
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de todos os posts com estatísticas de engajamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando posts...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visualizações</TableHead>
                    <TableHead>Engajamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium line-clamp-1">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {post.excerpt || "Sem descrição"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {post.categories.slice(0, 2).map((category) => (
                              <Badge
                                key={category.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {category.name}
                              </Badge>
                            ))}
                            {post.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={post.author.avatar}
                              alt={post.author.name}
                            />
                            <AvatarFallback className="text-xs">
                              {post.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {post.author.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {post.author.role}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.published ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Globe className="w-3 h-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <FileText className="w-3 h-3 mr-1" />
                              Rascunho
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatViews(post.views.total)}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatViews(post.views.thisMonth)} este mês
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{post.commentsCount}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.pendingCommentsCount} pendentes
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(post.createdAt)}</div>
                          {post.publishedAt && (
                            <div className="text-xs text-gray-500">
                              Pub: {formatDate(post.publishedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => openDialog("view", post)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openDialog("analytics", post)}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openDialog("edit", post)}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Ações de status */}
                            {post.published ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatusChange(post.id, false)
                                }
                                disabled={actionLoading}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Despublicar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatusChange(post.id, true)
                                }
                                disabled={actionLoading}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPost(post);
                                setDeleteConfirmOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPosts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum post encontrado</p>
                  <p className="text-sm mt-1">
                    Tente ajustar os filtros para encontrar posts
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição/Visualização/Analytics */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "edit" && "Editar Post"}
              {dialogType === "view" && "Detalhes do Post"}
              {dialogType === "analytics" && "Analytics do Post"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "edit" &&
                `Altere as informações de "${selectedPost?.title}".`}
              {dialogType === "view" &&
                `Informações detalhadas de "${selectedPost?.title}".`}
              {dialogType === "analytics" &&
                `Estatísticas de engajamento de "${selectedPost?.title}".`}
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {dialogType === "edit" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Título do post"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Descrição</Label>
                    <Textarea
                      id="excerpt"
                      value={editData.excerpt}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          excerpt: e.target.value,
                        }))
                      }
                      placeholder="Descrição do post"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="published"
                      type="checkbox"
                      checked={editData.published}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          published: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="published" className="text-sm">
                      Post publicado
                    </Label>
                  </div>
                </>
              ) : dialogType === "analytics" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatViews(selectedPost.views.total)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total de Visualizações
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedPost.commentsCount}
                          </div>
                          <div className="text-sm text-gray-600">
                            Comentários
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Este mês:</span>
                      <span className="font-medium">
                        {formatViews(selectedPost.views.thisMonth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Esta semana:</span>
                      <span className="font-medium">
                        {formatViews(selectedPost.views.thisWeek)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hoje:</span>
                      <span className="font-medium">
                        {selectedPost.views.today}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo médio na página:</span>
                      <span className="font-medium">
                        {formatTime(selectedPost.engagement.avgTimeOnPage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de rejeição:</span>
                      <span className="font-medium">
                        {(selectedPost.engagement.bounceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compartilhamentos:</span>
                      <span className="font-medium">
                        {selectedPost.engagement.shareCount}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">Status</p>
                      <p
                        className={
                          selectedPost.published
                            ? "text-green-600"
                            : "text-gray-600"
                        }
                      >
                        {selectedPost.published ? "✓ Publicado" : "○ Rascunho"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Autor</p>
                      <p className="text-gray-600">
                        {selectedPost.author.name}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Visualizações</p>
                      <p className="text-gray-600">
                        {formatViews(selectedPost.views.total)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Comentários</p>
                      <p className="text-gray-600">
                        {selectedPost.commentsCount}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Criado em</p>
                      <p className="text-gray-600">
                        {formatDate(selectedPost.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Atualizado em</p>
                      <p className="text-gray-600">
                        {formatDate(selectedPost.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {selectedPost.categories.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Categorias
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPost.categories.map((category) => (
                          <Badge
                            key={category.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPost.tags.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPost.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading}
            >
              {dialogType === "edit" ? "Cancelar" : "Fechar"}
            </Button>

            {dialogType === "edit" && (
              <Button
                onClick={handleEditSubmit}
                disabled={actionLoading || !editData.title.trim()}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o post{" "}
              <strong>"{selectedPost?.title}"</strong>? Esta ação não pode ser
              desfeita e todos os comentários e estatísticas serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Post
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
