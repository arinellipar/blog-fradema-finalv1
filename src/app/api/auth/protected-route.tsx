// src/components/auth/protected-route.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { ROUTES } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Props do componente ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Roles que podem acessar a rota
   * Se não especificado, apenas usuários autenticados podem acessar
   */
  allowedRoles?: UserRole[];
  /**
   * Rota de redirecionamento quando não autorizado
   * @default "/login"
   */
  redirectTo?: string;
  /**
   * Mensagem customizada de acesso negado
   */
  accessDeniedMessage?: string;
  /**
   * Se deve mostrar loading durante verificação
   * @default true
   */
  showLoading?: boolean;
}

/**
 * Componente ProtectedRoute
 * Protege rotas baseado em autenticação e roles
 *
 * @example
 * ```tsx
 * // Protege apenas com autenticação
 * <ProtectedRoute>
 *   <MyComponent />
 * </ProtectedRoute>
 *
 * // Protege com roles específicas
 * <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = ROUTES.login,
  accessDeniedMessage = "Você não tem permissão para acessar esta página",
  showLoading = true,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Verifica se usuário tem role permitida
  const hasPermission = React.useMemo(() => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role as UserRole);
  }, [user, allowedRoles]);

  // Redireciona para login se não autenticado
  React.useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(
        currentPath
      )}`;
      router.push(loginUrl);
    }
  }, [user, isLoading, router, redirectTo]);

  // Mostra loading durante verificação
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Não renderiza se não há usuário
  if (!user) {
    return null;
  }

  // Mostra página de acesso negado se não tem permissão
  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldAlert className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acesso Negado</CardTitle>
            <CardDescription>{accessDeniedMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sua role atual: <span className="font-medium">{user.role}</span>
            </p>
            {allowedRoles && allowedRoles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Roles necessárias: {allowedRoles.join(", ")}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => router.back()} variant="outline">
                Voltar
              </Button>
              <Button onClick={() => router.push(ROUTES.dashboard)}>
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook para verificar permissões
 * Útil para mostrar/ocultar elementos baseado em roles
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasRole, hasAnyRole } = usePermissions();
 *
 *   return (
 *     <div>
 *       {hasRole(UserRole.ADMIN) && <AdminButton />}
 *       {hasAnyRole([UserRole.ADMIN, UserRole.EDITOR]) && <EditButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = React.useCallback(
    (role: UserRole): boolean => {
      return user?.role === role;
    },
    [user]
  );

  const hasAnyRole = React.useCallback(
    (roles: UserRole[]): boolean => {
      return user ? roles.includes(user.role as UserRole) : false;
    },
    [user]
  );

  const hasAllRoles = React.useCallback(
    (roles: UserRole[]): boolean => {
      // Para sistema de role única, verifica se tem pelo menos uma das roles
      return hasAnyRole(roles);
    },
    [hasAnyRole]
  );

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole(UserRole.ADMIN),
    isEditor: hasRole(UserRole.EDITOR),
    isAuthor: hasRole(UserRole.AUTHOR),
    isSubscriber: hasRole(UserRole.SUBSCRIBER),
  };
}

/**
 * Componente AdminOnly
 * Renderiza children apenas para administradores
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = usePermissions();
  return isAdmin ? <>{children}</> : null;
}

/**
 * Componente EditorOnly
 * Renderiza children apenas para editores e admins
 */
export function EditorOnly({ children }: { children: React.ReactNode }) {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole([UserRole.ADMIN, UserRole.EDITOR]) ? <>{children}</> : null;
}

/**
 * Componente AuthorOnly
 * Renderiza children apenas para autores, editores e admins
 */
export function AuthorOnly({ children }: { children: React.ReactNode }) {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR]) ? (
    <>{children}</>
  ) : null;
}
