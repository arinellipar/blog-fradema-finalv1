// src/hooks/use-dashboard.tsx - Hook para Dashboard com API Real

"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

// Tipos para o dashboard
interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  detail: string;
  priority: "high" | "medium" | "low";
  icon: string;
  color: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  lastUpdated: Date;
}

interface ServiceMetric {
  id: string;
  name: string;
  completed: number;
  pending: number;
  overdue: number;
  revenue: number;
  avgTicket: number;
  clientCount: number;
  completionRate: number;
  icon: string;
  color: string;
  trend: number;
  lastUpdated: Date;
}

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  status: "completed" | "pending" | "overdue" | "upcoming";
  client: {
    id: string;
    name: string;
    cnpj?: string;
  };
  priority: "high" | "medium" | "low";
  assignedTo?: {
    id: string;
    name: string;
  };
  category: "tax" | "fiscal" | "accounting" | "legal";
  createdAt: Date;
  updatedAt: Date;
}

interface RecentActivity {
  id: string;
  type:
    | "client_new"
    | "compliance_completed"
    | "audit_started"
    | "payment_received"
    | "deadline_alert"
    | "document_uploaded"
    | "meeting_scheduled";
  description: string;
  timestamp: Date;
  client?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  amount?: number;
  status: "success" | "warning" | "info" | "error";
  metadata?: Record<string, any>;
}

interface DashboardData {
  mainMetrics: DashboardMetric[];
  serviceMetrics: ServiceMetric[];
  upcomingCompliance: ComplianceItem[];
  recentActivities: RecentActivity[];
  lastUpdated: Date;
}

interface DashboardFilters {
  period: "week" | "month" | "quarter" | "year";
  dateFrom?: Date;
  dateTo?: Date;
  clientIds?: string[];
  serviceTypes?: string[];
}

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: Partial<DashboardFilters>;
}

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  isRefreshing: boolean;
}

// Configuração da API (não usado mais - dados mockados)
// const API_BASE_URL = "/api";

/**
 * Hook para gerenciar dados do dashboard com dados mockados
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    autoRefresh = true,
    refreshInterval = 10 * 60 * 1000, // 10 minutos
    filters = { period: "month" },
  } = options;

  // Estado do dashboard
  const [state, setState] = React.useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
    lastFetch: null,
    isRefreshing: false,
  });

  // Refs para controle
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Dados mockados do dashboard
   */
  const mockData = React.useMemo((): DashboardData => {
    return {
      mainMetrics: [],
      serviceMetrics: [
        {
          id: "tax_planning",
          name: "Planejamento Tributário",
          completed: 12,
          pending: 3,
          overdue: 1,
          revenue: 45000,
          avgTicket: 3750,
          clientCount: 15,
          completionRate: 85.7,
          icon: "Calculator",
          color: "from-blue-500 to-indigo-600",
          trend: 12.5,
          lastUpdated: new Date(),
        },
        {
          id: "fiscal_compliance",
          name: "Compliance Fiscal",
          completed: 28,
          pending: 5,
          overdue: 2,
          revenue: 67000,
          avgTicket: 1914,
          clientCount: 35,
          completionRate: 92.3,
          icon: "Shield",
          color: "from-green-500 to-emerald-600",
          trend: 8.7,
          lastUpdated: new Date(),
        },
        {
          id: "audit_support",
          name: "Suporte a Auditoria",
          completed: 8,
          pending: 2,
          overdue: 0,
          revenue: 32000,
          avgTicket: 4000,
          clientCount: 8,
          completionRate: 100,
          icon: "Eye",
          color: "from-purple-500 to-pink-600",
          trend: 25.0,
          lastUpdated: new Date(),
        },
        {
          id: "legal_consulting",
          name: "Consultoria Jurídica",
          completed: 15,
          pending: 4,
          overdue: 1,
          revenue: 38000,
          avgTicket: 2533,
          clientCount: 15,
          completionRate: 88.2,
          icon: "Gavel",
          color: "from-orange-500 to-red-600",
          trend: 18.2,
          lastUpdated: new Date(),
        },
      ],
      upcomingCompliance: [
        {
          id: "comp_001",
          name: "Declaração IRPF 2024",
          description: "Declaração anual de imposto de renda",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          status: "pending" as const,
          client: {
            id: "client_001",
            name: "Empresa ABC Ltda",
            cnpj: "12.345.678/0001-90",
          },
          priority: "high" as const,
          assignedTo: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
          },
          category: "tax" as const,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "comp_002",
          name: "DAS - Simples Nacional",
          description: "Declaração do Simples Nacional",
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          status: "pending" as const,
          client: {
            id: "client_002",
            name: "Comércio XYZ",
            cnpj: "98.765.432/0001-10",
          },
          priority: "high" as const,
          assignedTo: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
          },
          category: "fiscal" as const,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "comp_003",
          name: "SPED Fiscal",
          description: "Escrituração digital de documentos fiscais",
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          status: "overdue" as const,
          client: {
            id: "client_003",
            name: "Indústria DEF",
            cnpj: "11.222.333/0001-44",
          },
          priority: "high" as const,
          assignedTo: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
          },
          category: "fiscal" as const,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "comp_004",
          name: "Relatório Contábil",
          description: "Relatório mensal de contabilidade",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
          status: "pending" as const,
          client: {
            id: "client_004",
            name: "Serviços GHI",
            cnpj: "55.666.777/0001-88",
          },
          priority: "medium" as const,
          assignedTo: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
          },
          category: "accounting" as const,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "comp_005",
          name: "Revisão Contratual",
          description: "Revisão de contratos comerciais",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
          status: "upcoming" as const,
          client: {
            id: "client_005",
            name: "Consultoria JKL",
            cnpj: "33.444.555/0001-22",
          },
          priority: "medium" as const,
          assignedTo: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
          },
          category: "legal" as const,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ],
      recentActivities: [
        {
          id: "act_001",
          type: "client_new" as const,
          description: "Novo cliente cadastrado",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          client: {
            id: "client_006",
            name: "Startup MNO",
          },
          user: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
            avatar: user?.avatar,
          },
          status: "success" as const,
        },
        {
          id: "act_002",
          type: "compliance_completed" as const,
          description: "Declaração IRPF concluída",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
          client: {
            id: "client_007",
            name: "Empresa PQR",
          },
          user: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
            avatar: user?.avatar,
          },
          amount: 2500,
          status: "success" as const,
        },
        {
          id: "act_003",
          type: "payment_received" as const,
          description: "Pagamento recebido",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
          client: {
            id: "client_008",
            name: "Comércio STU",
          },
          user: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
            avatar: user?.avatar,
          },
          amount: 5000,
          status: "success" as const,
        },
        {
          id: "act_004",
          type: "deadline_alert" as const,
          description: "Prazo de SPED Fiscal vencido",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
          client: {
            id: "client_003",
            name: "Indústria DEF",
          },
          user: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
            avatar: user?.avatar,
          },
          status: "error" as const,
        },
        {
          id: "act_005",
          type: "audit_started" as const,
          description: "Auditoria fiscal iniciada",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
          client: {
            id: "client_009",
            name: "Empresa VWX",
          },
          user: {
            id: user?.id || "user_001",
            name: user?.name || "Usuário",
            avatar: user?.avatar,
          },
          status: "warning" as const,
        },
      ],
      lastUpdated: new Date(),
    };
  }, [user]);

  /**
   * Carregar dados mockados
   */
  const loadMockData = React.useCallback(
    async (isRefresh = false) => {
      if (!user) return;

      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 300));

      setState((prev) => ({
        ...prev,
        data: mockData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastFetch: new Date(),
      }));

      if (isRefresh) {
        toast.success("Dashboard atualizado", {
          description: "Dados atualizados com sucesso",
        });
      }
    },
    [user]
  );

  /**
   * Refresh manual dos dados
   */
  const refreshData = React.useCallback(
    async (newFilters?: Partial<DashboardFilters>) => {
      await loadMockData(true);
    },
    [loadMockData]
  );

  /**
   * Atualizar filtros
   */
  const updateFilters = React.useCallback(
    async (newFilters: Partial<DashboardFilters>) => {
      await loadMockData(false);
    },
    [loadMockData]
  );

  /**
   * Buscar dados iniciais quando o usuário muda
   */
  React.useEffect(() => {
    if (user && !state.data) {
      loadMockData();
    }
  }, [user]);

  /**
   * Configurar auto-refresh
   */
  React.useEffect(() => {
    if (autoRefresh && user && state.data) {
      refreshIntervalRef.current = setInterval(() => {
        // Só fazer refresh se não estiver carregando
        if (!state.isLoading && !state.isRefreshing) {
          loadMockData(true);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, user, state.data, refreshInterval]);

  /**
   * Cleanup ao desmontar
   */
  React.useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  /**
   * Métodos utilitários
   */
  const getMetricById = React.useCallback(
    (id: string) => {
      return state.data?.mainMetrics.find((metric) => metric.id === id);
    },
    [state.data]
  );

  const getServiceById = React.useCallback(
    (id: string) => {
      return state.data?.serviceMetrics.find((service) => service.id === id);
    },
    [state.data]
  );

  const getComplianceByStatus = React.useCallback(
    (status: ComplianceItem["status"]) => {
      return (
        state.data?.upcomingCompliance.filter(
          (item) => item.status === status
        ) || []
      );
    },
    [state.data]
  );

  const getActivitiesByType = React.useCallback(
    (type: RecentActivity["type"]) => {
      return (
        state.data?.recentActivities.filter(
          (activity) => activity.type === type
        ) || []
      );
    },
    [state.data]
  );

  return {
    // Estado
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    lastFetch: state.lastFetch,
    isRefreshing: state.isRefreshing,

    // Ações
    refreshData,
    updateFilters,

    // Utilitários
    getMetricById,
    getServiceById,
    getComplianceByStatus,
    getActivitiesByType,

    // Flags úteis
    hasData: !!state.data,
    isEmpty: !state.isLoading && !state.data,
    isStale: state.lastFetch
      ? Date.now() - state.lastFetch.getTime() > refreshInterval
      : false,
  };
}

/**
 * Hook específico para métricas principais
 */
export function useDashboardMetrics(
  period: DashboardFilters["period"] = "month"
) {
  const { data, isLoading, error, refreshData } = useDashboard({
    filters: { period },
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutos para métricas
  });

  return {
    metrics: data?.mainMetrics || [],
    isLoading,
    error,
    refreshData,
  };
}

/**
 * Hook específico para compliance
 */
export function useDashboardCompliance() {
  const { data, isLoading, error, refreshData, getComplianceByStatus } =
    useDashboard({
      filters: { period: "month" },
      autoRefresh: true,
      refreshInterval: 15 * 60 * 1000, // 15 minutos para compliance
    });

  return {
    compliance: data?.upcomingCompliance || [],
    overdue: getComplianceByStatus("overdue"),
    pending: getComplianceByStatus("pending"),
    upcoming: getComplianceByStatus("upcoming"),
    completed: getComplianceByStatus("completed"),
    isLoading,
    error,
    refreshData,
  };
}

/**
 * Utilitários (não usado mais - dados mockados)
 */
// function generateCorrelationId(): string {
//   return Math.random().toString(36).substring(2, 8);
// }
