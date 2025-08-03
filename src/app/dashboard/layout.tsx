// src/app/dashboard/layout.tsx

"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/utils";
import { UserRole } from "@/types/auth";

/**
 * Layout do Dashboard
 * Protege rotas autenticadas e fornece estrutura comum
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redireciona para login se não autenticado
  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(ROUTES.login);
      } else if (user.role !== UserRole.ADMIN) {
        router.push(ROUTES.home);
      }
    }
  }, [user, isLoading, router]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Não renderiza nada se não há usuário ou não é admin (será redirecionado)
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return <>{children}</>;
}
