// src/app/dashboard/page.tsx - Dashboard com acesso à administração de usuários

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  BarChart3,
  PlusCircle,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
  Bell,
  Sparkles,
  PenTool,
  Home,
  Calculator,
  Gavel,
  ClipboardCheck,
  Target,
  Briefcase,
  FileCheck,
  AlertCircle as Alert,
  Timer,
  TrendingUp as Growth,
  Building,
  Scale,
  Receipt,
  BookOpen,
  UserCheck,
  FileX,
  Zap,
  Award,
  Eye,
  RefreshCw,
  Loader2,
  MessageCircle,
  Settings,
  UserPlus, // Adicionado para o botão de admin
  Crown, // Adicionado para o botão de admin
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  useDashboard,
  useDashboardMetrics,
  useDashboardCompliance,
} from "@/hooks/use-dashboard";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/utils";
import { UserRole } from "@/types/auth";

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users,
  DollarSign,
  Calculator,
  CheckCircle,
  Shield,
  Target,
  Award,
  Timer,
  BarChart3,
  FileCheck,
  Gavel,
  ClipboardCheck,
  UserCheck,
  Eye,
  Alert,
  TrendingUp,
  TrendingDown,
  Activity,
  // Adicionar aliases para garantir que funcionem
  users: Users,
  dollarsign: DollarSign,
  calculator: Calculator,
  checkcircle: CheckCircle,
  shield: Shield,
  target: Target,
  award: Award,
  timer: Timer,
  barchart3: BarChart3,
  filecheck: FileCheck,
  gavel: Gavel,
  clipboardcheck: ClipboardCheck,
  usercheck: UserCheck,
  eye: Eye,
  alert: Alert,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  activity: Activity,
};

export default function RealTimeDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  // Hooks do dashboard
  const {
    data: dashboardData,
    isLoading,
    error,
    refreshData,
    updateFilters,
    isRefreshing,
    lastFetch,
    isStale,
  } = useDashboard({
    filters: { period: selectedPeriod },
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutos
  });

  const { compliance, overdue, pending } = useDashboardCompliance();

  // Atualizar relógio
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Verificar permissões
  const canCreatePost = React.useMemo(() => {
    return (
      user &&
      [UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR].includes(user.role)
    );
  }, [user]);

  // Verificar se é admin (NOVO)
  const isAdmin = React.useMemo(() => {
    return user && user.role === UserRole.ADMIN;
  }, [user]);

  // Handlers
  const handleCreatePost = () => {
    if (!canCreatePost) {
      toast.error("Permissão negada", {
        description: "Você não tem permissão para criar posts",
      });
      return;
    }
    router.push("/dashboard/novo-post");
  };

  const handleViewBlog = () => {
    router.push("/blog");
  };

  // Handler para ir para administração de usuários (NOVO)
  const handleUserManagement = () => {
    if (!isAdmin) {
      toast.error("Permissão negada", {
        description: "Apenas administradores podem gerenciar usuários",
      });
      return;
    }
    router.push("/admin");
  };

  const handlePeriodChange = async (period: typeof selectedPeriod) => {
    setSelectedPeriod(period);
    try {
      await updateFilters({ period });
    } catch (error) {
      console.error("Error updating filters:", error);
      toast.error("Erro ao atualizar período", {
        description: "Não foi possível atualizar os filtros",
      });
    }
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Carregar número de comentários pendentes
  const loadPendingCommentsCount = async () => {
    try {
      const response = await fetch("/api/comments/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingCommentsCount(data.length);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários pendentes:", error);
    }
  };

  // Carregar contagem de comentários pendentes
  React.useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      loadPendingCommentsCount();
    }
  }, [user]);

  // Render de loading
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50">
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Carregando Dashboard
              </h2>
              <p className="text-gray-600">Buscando dados analíticos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render de loading quando não há usuário ainda
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50">
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verificando Autenticação
              </h2>
              <p className="text-gray-600">Carregando dados do usuário...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render de erro
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro no Dashboard
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={() => router.push(ROUTES.home)}>
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Analytics Tributário
                  </h1>
                  <p className="text-sm text-gray-500">
                    Consultoria Tributária Fradema
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Dashboard Pro
              </Badge>

              {/* Status de dados */}
              {isStale && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Dados desatualizados
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Seletor de período */}
              <div className="flex items-center gap-2 bg-gray-100/70 rounded-lg p-1">
                {(["week", "month", "quarter", "year"] as const).map(
                  (period) => (
                    <Button
                      key={period}
                      size="sm"
                      variant={selectedPeriod === period ? "default" : "ghost"}
                      onClick={() => {
                        if (!isLoading && !isRefreshing) {
                          handlePeriodChange(period);
                        }
                      }}
                      className="text-xs"
                      disabled={isLoading || isRefreshing}
                    >
                      {period === "week"
                        ? "7d"
                        : period === "month"
                        ? "30d"
                        : period === "quarter"
                        ? "90d"
                        : "1y"}
                    </Button>
                  )
                )}
              </div>

              {/* Botão de refresh */}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </Button>

              {/* Status da última atualização */}
              <div className="px-4 py-2 bg-gray-100/70 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-gray-700">
                    {currentTime.toLocaleTimeString("pt-BR")}
                  </span>
                </div>
                {lastFetch && (
                  <div className="text-xs text-gray-500 text-center">
                    Atualizado: {lastFetch.toLocaleTimeString("pt-BR")}
                  </div>
                )}
              </div>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {overdue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {overdue.length}
                    </span>
                  </span>
                )}
              </Button>

              <Button variant="outline" asChild>
                <a href={ROUTES.home}>
                  <Home className="w-4 h-4 mr-2" />
                  Site
                </a>
              </Button>

              <Button variant="outline" onClick={logout}>
                Sair
              </Button>

              <Avatar className="h-8 w-8 ring-2 ring-blue-500/20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo, {user?.name?.split(" ")[0] || "Usuário"}! 👋
              </h2>
              <p className="text-gray-600">
                Visão geral dos seus serviços tributários e performance da
                consultoria.
                {dashboardData?.lastUpdated && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Última atualização:{" "}
                    {dashboardData.lastUpdated.toLocaleString("pt-BR")})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleViewBlog}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Ver Blog
              </Button>

              {canCreatePost && (
                <Button
                  onClick={handleCreatePost}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Criar Artigo
                </Button>
              )}

              <Button
                onClick={() => router.push("/dashboard/comentarios")}
                variant="outline"
                className="flex items-center gap-2 relative"
              >
                <MessageCircle className="w-4 h-4" />
                Comentários
                {pendingCommentsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {pendingCommentsCount}
                  </Badge>
                )}
              </Button>

              {/* NOVO: Botão para Administração de Usuários */}
              {isAdmin && (
                <Button
                  onClick={handleUserManagement}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Admin
                </Button>
              )}
            </div>
          </div>

          {/* Resto do conteúdo permanece igual... */}
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {(dashboardData?.mainMetrics || [])
              .slice(0, 4)
              .map((metric, index) => {
                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-xl ${metric.color} shadow-lg`}
                            >
                              {metric.icon === "DollarSign" && (
                                <DollarSign className="w-6 h-6 text-white" />
                              )}
                              {metric.icon === "Users" && (
                                <Users className="w-6 h-6 text-white" />
                              )}
                              {metric.icon === "Shield" && (
                                <Shield className="w-6 h-6 text-white" />
                              )}
                              {metric.icon === "Calculator" && (
                                <Calculator className="w-6 h-6 text-white" />
                              )}
                              {![
                                "DollarSign",
                                "Users",
                                "Shield",
                                "Calculator",
                              ].includes(metric.icon) && (
                                <BarChart3 className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                {metric.label}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  {metric.value}
                                </span>
                                <div
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    metric.trend === "up"
                                      ? "bg-green-100 text-green-700"
                                      : metric.trend === "down"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {metric.trend === "up" ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : metric.trend === "down" ? (
                                    <TrendingDown className="w-3 h-3" />
                                  ) : (
                                    <Activity className="w-3 h-3" />
                                  )}
                                  {Math.abs(metric.change).toFixed(1)}%
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {metric.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>

          {/* Ações Rápidas - ATUALIZADA */}
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {canCreatePost && (
                <div
                  onClick={handleCreatePost}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <PenTool className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Novo Artigo</h4>
                      <p className="text-sm text-gray-600">Criar conteúdo</p>
                    </div>
                  </div>
                </div>
              )}

              <div
                onClick={handleViewBlog}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Ver Blog</h4>
                    <p className="text-sm text-gray-600">Conteúdo público</p>
                  </div>
                </div>
              </div>

              {/* NOVO: Card para Administração de Usuários */}
              {isAdmin && (
                <div
                  onClick={handleUserManagement}
                  className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Usuários</h4>
                      <p className="text-sm text-gray-600">
                        Gerenciar usuários
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Compliance</h4>
                    <p className="text-sm text-gray-600">Obrigações fiscais</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Planejamento</h4>
                    <p className="text-sm text-gray-600">Estratégias fiscais</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resto das seções permanecem iguais... */}
        </div>
      </main>
    </div>
  );
}
