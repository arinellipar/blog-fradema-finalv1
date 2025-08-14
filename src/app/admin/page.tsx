/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/admin/page.tsx - VERSÃO ATUALIZADA COM GERENCIAMENTO COMPLETO

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  FileText,
  BarChart3,
  Settings,
  Crown,
  Loader2,
  UserPlus,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Activity,
  UserCheck,
  Home,
  ArrowLeft,
  Calculator,
  Gavel,
  ClipboardCheck,
  Target,
  Briefcase,
  FileCheck,
  Timer,
  TrendingUp as Growth,
  PieChart,
  Building,
  Scale,
  Receipt,
  BookOpen,
  FileX,
  Zap,
  Award,
  Eye,
  Globe,
  MessageCircle,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserManagement } from "@/components/admin/user-management";
import { PostsManagement } from "@/components/admin/posts-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/auth";
import { formatDate, ROUTES } from "@/lib/utils";

// Interfaces para dados mockados de analytics tributários
interface ServiceMetric {
  id: string;
  name: string;
  completed: number;
  pending: number;
  overdue: number;
  revenue: number;
  icon: any;
  color: string;
}

interface ComplianceItem {
  id: string;
  name: string;
  deadline: Date;
  status: "completed" | "pending" | "overdue" | "upcoming";
  client?: string;
  priority: "high" | "medium" | "low";
}

interface RecentActivity {
  id: string;
  type:
    | "user_login"
    | "user_register"
    | "post_create"
    | "system_error"
    | "admin_action";
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  metadata?: any;
}

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalComments: number;
  recentSignups: number;
  activeUsers: number;
  systemHealth: "healthy" | "warning" | "critical";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
}

export default function AdminPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Estados principais
  const [users, setUsers] = React.useState<User[]>([]);
  const [adminStats, setAdminStats] = React.useState<AdminStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    totalComments: 0,
    recentSignups: 0,
    activeUsers: 0,
    systemHealth: "healthy",
  });
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentView, setCurrentView] = React.useState<
    "dashboard" | "users" | "posts" | "settings"
  >("dashboard");

  // Estados para ações
  const [actionLoading, setActionLoading] = React.useState(false);

  // Verificar se usuário é admin
  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.ADMIN)) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar esta página",
      });
      router.push(ROUTES.dashboard);
    }
  }, [user, authLoading, router, toast]);

  // Carregar dados iniciais
  React.useEffect(() => {
    if (user && user.role === UserRole.ADMIN) {
      loadAdminData();

      // Atualizar dados a cada 30 segundos no dashboard
      if (currentView === "dashboard") {
        const interval = setInterval(loadAdminData, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [user, currentView]);

  // Função para carregar todos os dados do admin
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUsers(), loadAdminStats(), loadRecentActivity()]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados", {
        description: "Alguns dados podem estar desatualizados",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        const usersData = data.users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastLoginAt: user.lastLoginAt
            ? new Date(user.lastLoginAt)
            : undefined,
        }));

        setUsers(usersData);
        return usersData;
      } else {
        throw new Error(data.error?.message || "Erro ao carregar usuários");
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      throw error;
    }
  };

  // Carregar estatísticas administrativas
  const loadAdminStats = async () => {
    try {
      // Para posts, tentar carregar da API se disponível
      let postsStats = {
        totalPosts: 0,
        publishedPosts: 0,
        totalViews: 0,
        totalComments: 0,
      };

      try {
        const postsResponse = await fetch("/api/admin/posts", {
          credentials: "include",
        });
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          postsStats = {
            totalPosts: postsData.stats.totalPosts || 0,
            publishedPosts: postsData.stats.publishedPosts || 0,
            totalViews: postsData.stats.totalViews || 0,
            totalComments: postsData.stats.totalComments || 0,
          };
        }
      } catch (error) {
        console.warn("Posts API not available, using mock data");
      }

      // Calcular estatísticas dos usuários
      const userStats = {
        totalUsers: users.length || 0,
        totalAdmins: users.filter((u) => u.role === UserRole.ADMIN).length || 0,
        recentSignups:
          users.filter((u) => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return u.createdAt > weekAgo;
          }).length || 0,
        activeUsers:
          users.filter((u) => {
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return u.lastLoginAt && u.lastLoginAt > dayAgo;
          }).length || 0,
      };

      const combinedStats: AdminStats = {
        ...userStats,
        ...postsStats,
        systemHealth: "healthy" as const,
      };

      setAdminStats(combinedStats);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
      throw error;
    }
  };

  // Carregar atividade recente
  const loadRecentActivity = async () => {
    try {
      // Simular atividade recente - em produção, buscar da API de logs
      const mockActivity: RecentActivity[] = [
        {
          id: "1",
          type: "user_register",
          description: "Novo usuário cadastrado no sistema",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          userName: "João Silva",
        },
        {
          id: "2",
          type: "admin_action",
          description: "Usuário promovido a administrador",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          userName: user?.name || "Admin",
        },
        {
          id: "3",
          type: "post_create",
          description: "Novo post criado e publicado",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          userName: "Editor do Blog",
        },
        {
          id: "4",
          type: "user_login",
          description: "Login de usuário administrador",
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          userName: user?.name || "Admin",
        },
        {
          id: "5",
          type: "system_error",
          description: "Erro de conexão com serviço externo resolvido",
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
      ];

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error("Erro ao carregar atividade:", error);
      throw error;
    }
  };

  // Handlers de ação para usuários
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, ...updates } : user
          )
        );

        toast.success("Usuário atualizado", {
          description: "As informações foram atualizadas com sucesso",
        });

        await loadAdminStats(); // Recarregar stats
      } else {
        throw new Error(data.error?.message || "Erro ao atualizar usuário");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar", {
        description: error.message,
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("Ação não permitida", {
        description: "Você não pode deletar sua própria conta",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        toast.success("Usuário removido", {
          description: "O usuário foi removido do sistema",
        });

        await loadAdminStats(); // Recarregar stats
      } else {
        throw new Error(data.error?.message || "Erro ao deletar usuário");
      }
    } catch (error: any) {
      toast.error("Erro ao deletar", {
        description: error.message,
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Funções utilitárias
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_register":
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case "user_login":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case "post_create":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "admin_action":
        return <Shield className="w-4 h-4 text-orange-600" />;
      case "system_error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getHealthColor = (health: AdminStats["systemHealth"]) => {
    switch (health) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Loading state
  if (
    authLoading ||
    (isLoading && users.length === 0 && currentView === "dashboard")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando painel administrativo...
          </p>
        </div>
      </div>
    );
  }

  // Verificação de acesso
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Painel Administrativo
                </h1>
              </div>
              <Badge className="bg-red-100 text-red-800">
                <Crown className="w-3 h-3 mr-1" />
                Administrador
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <a href={ROUTES.home}>
                  <Home className="w-4 h-4 mr-2" />
                  Site
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={ROUTES.dashboard}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </a>
              </Button>
              <Button variant="outline" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentView === "dashboard" ? "default" : "outline"}
            onClick={() => setCurrentView("dashboard")}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={currentView === "users" ? "default" : "outline"}
            onClick={() => setCurrentView("users")}
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant={currentView === "posts" ? "default" : "outline"}
            onClick={() => setCurrentView("posts")}
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </Button>
          <Button
            variant={currentView === "settings" ? "default" : "outline"}
            onClick={() => setCurrentView("settings")}
            size="sm"
            disabled
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.totalUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{adminStats.recentSignups} novos esta semana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Posts Publicados
                  </CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.publishedPosts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {adminStats.totalPosts} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Visualizações
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.totalViews.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em todos os posts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getHealthColor(
                      adminStats.systemHealth
                    )}`}
                  >
                    {adminStats.systemHealth === "healthy"
                      ? "Saudável"
                      : adminStats.systemHealth === "warning"
                      ? "Atenção"
                      : "Crítico"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status do sistema
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards Secundários */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Administradores
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.totalAdmins}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (adminStats.totalAdmins / (adminStats.totalUsers || 1)) *
                      100
                    ).toFixed(1)}
                    % do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários Ativos
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Últimas 24 horas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Comentários
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.totalComments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em todos os posts
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Atividade Recente e Ações Rápidas */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimas ações no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {activity.userName && (
                              <span>{activity.userName}</span>
                            )}
                            <span>•</span>
                            <span>{formatDate(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Ferramentas de administração do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => setCurrentView("users")}
                    >
                      <Users className="w-6 h-6 mb-2" />
                      Gerenciar Usuários
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => setCurrentView("posts")}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      Gerenciar Posts
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => loadAdminData()}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`w-6 h-6 mb-2 ${
                          isLoading ? "animate-spin" : ""
                        }`}
                      />
                      Atualizar Dados
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      disabled
                    >
                      <Settings className="w-6 h-6 mb-2" />
                      Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Sistema</CardTitle>
                <CardDescription>
                  Estatísticas detalhadas e métricas de performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {adminStats.totalUsers}
                    </div>
                    <p className="text-sm text-gray-600">Usuários Totais</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {adminStats.totalPosts}
                    </div>
                    <p className="text-sm text-gray-600">Posts Criados</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {adminStats.totalViews.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Visualizações</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {adminStats.totalComments}
                    </div>
                    <p className="text-sm text-gray-600">Comentários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users View */}
        {currentView === "users" && (
          <UserManagement
            users={users}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onRefreshUsers={loadUsers}
            currentUserId={user.id}
            isLoading={isLoading}
          />
        )}

        {/* Posts View */}
        {currentView === "posts" && (
          <PostsManagement currentUserId={user.id} isLoading={isLoading} />
        )}

        {/* Settings View (Placeholder) */}
        {currentView === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Esta funcionalidade estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
