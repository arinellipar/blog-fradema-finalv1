/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// src/hooks/use-auth-actions.tsx

"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/utils";

/**
 * Hook para ações de autenticação com feedback visual
 * Abstrai a lógica comum de autenticação com toast notifications
 */
export function useAuthActions() {
  const { login, register, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  /**
   * Login com feedback visual
   */
  const loginWithFeedback = React.useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      try {
        await login({ email, password, rememberMe });

        toast({
          title: "Login realizado",
          description: "Bem-vindo de volta!",
          variant: "success" as any,
        });

        return true;
      } catch (error: any) {
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return false;
      }
    },
    [login, toast]
  );

  /**
   * Registro com feedback visual
   */
  const registerWithFeedback = React.useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      acceptTerms: boolean;
      newsletterOptIn?: boolean;
    }) => {
      try {
        await register(data);

        toast({
          title: "Conta criada",
          description: "Bem-vindo! Verifique seu email para ativação.",
          variant: "success" as any,
        });

        return true;
      } catch (error: any) {
        toast({
          title: "Erro no registro",
          description: error.message || "Erro ao criar conta",
          variant: "destructive",
        });
        return false;
      }
    },
    [register, toast]
  );

  /**
   * Logout com feedback visual
   */
  const logoutWithFeedback = React.useCallback(
    async (showToast = true) => {
      try {
        await logout();

        if (showToast) {
          toast({
            title: "Logout realizado",
            description: "Até logo!",
            variant: "success" as any,
          });
        }

        return true;
      } catch (error: any) {
        if (showToast) {
          toast({
            title: "Erro no logout",
            description: error.message || "Erro ao fazer logout",
            variant: "destructive",
          });
        }
        return false;
      }
    },
    [logout, toast]
  );

  /**
   * Solicita reset de senha
   */
  const requestPasswordReset = React.useCallback(
    async (email: string) => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Email enviado",
            description: "Verifique sua caixa de entrada",
            variant: "success" as any,
          });
          return true;
        } else {
          toast({
            title: "Erro",
            description: data.error?.message || "Erro ao enviar email",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Erro de conexão",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  /**
   * Confirma reset de senha
   */
  const confirmPasswordReset = React.useCallback(
    async (token: string, newPassword: string) => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Senha redefinida",
            description: "Sua senha foi atualizada com sucesso",
            variant: "success" as any,
          });

          // Redireciona para login
          router.push(ROUTES.login);
          return true;
        } else {
          toast({
            title: "Erro",
            description: data.error?.message || "Token inválido",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Erro de conexão",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, router]
  );

  /**
   * Verifica email
   */
  const verifyEmail = React.useCallback(
    async (token: string) => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Email verificado",
            description: "Sua conta foi ativada com sucesso",
            variant: "success" as any,
          });
          return true;
        } else {
          toast({
            title: "Erro",
            description: data.error?.message || "Token inválido",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Erro de conexão",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  return {
    loginWithFeedback,
    registerWithFeedback,
    logoutWithFeedback,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    isLoading,
  };
}

/**
 * Hook para verificar se o usuário está autenticado
 * Útil para components que precisam apenas verificar autenticação
 */
export function useIsAuthenticated() {
  const { user, isLoading } = useAuth();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}

/**
 * Hook para redirecionamento baseado em autenticação
 * Útil para páginas que precisam redirecionar baseado no estado de auth
 */
export function useAuthRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const redirectIfAuthenticated = React.useCallback(
    (to: string = ROUTES.dashboard) => {
      if (!isLoading && user) {
        router.push(to);
      }
    },
    [user, isLoading, router]
  );

  const redirectIfNotAuthenticated = React.useCallback(
    (to: string = ROUTES.login) => {
      if (!isLoading && !user) {
        const currentPath = window.location.pathname;
        const loginUrl = `${to}?redirect=${encodeURIComponent(currentPath)}`;
        router.push(loginUrl);
      }
    },
    [user, isLoading, router]
  );

  const redirectToReturnUrl = React.useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("redirect") || ROUTES.dashboard;
    router.push(returnUrl);
  }, [router]);

  return {
    redirectIfAuthenticated,
    redirectIfNotAuthenticated,
    redirectToReturnUrl,
  };
}

/**
 * Hook para status de loading de autenticação
 * Útil para mostrar spinners durante operações de auth
 */
export function useAuthStatus() {
  const { isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading) {
      setIsInitializing(false);
    }
  }, [isLoading]);

  return {
    isLoading,
    isInitializing,
    isReady: !isLoading && !isInitializing,
  };
}
