/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/verify-email/verify-email-form.tsx

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/utils";

/**
 * Estados da verificação de email
 */
type VerificationStatus = "verifying" | "success" | "error" | "expired";

/**
 * Componente de Verificação de Email
 * Processa o token de verificação e atualiza o status da conta
 */
export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<VerificationStatus>("verifying");
  const [userEmail, setUserEmail] = React.useState<string>("");

  // Verifica o token ao carregar a página
  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyEmail = async () => {
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
          setStatus("success");
          setUserEmail(data.user?.email || "");

          toast({
            title: "Email verificado!",
            description: "Sua conta foi ativada com sucesso.",
            variant: "success" as any,
          });
        } else {
          if (data.error?.code === "TOKEN_EXPIRED") {
            setStatus("expired");
          } else {
            setStatus("error");
          }

          toast({
            title: "Erro na verificação",
            description: data.error?.message || "Token inválido ou expirado",
            variant: "destructive",
          });
        }
      } catch {
        setStatus("error");

        toast({
          title: "Erro",
          description: "Erro de conexão. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [token, toast]);

  /**
   * Solicita novo token de verificação
   */
  const resendVerification = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        toast({
          title: "Email enviado!",
          description: "Um novo link de verificação foi enviado.",
          variant: "success" as any,
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao enviar email de verificação.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Erro de conexão.",
        variant: "destructive",
      });
    }
  };

  /**
   * Renderiza conteúdo baseado no status
   */
  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium">Verificando email...</h3>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto validamos seu email.
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-green-900">
                Email verificado com sucesso!
              </h3>
              <p className="text-sm text-muted-foreground">
                Sua conta foi ativada e você já pode fazer login.
              </p>
              {userEmail && <p className="text-sm font-medium">{userEmail}</p>}
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => router.push(ROUTES.login)}
                className="w-full"
              >
                Fazer login
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <Button
                onClick={() => router.push(ROUTES.dashboard)}
                variant="outline"
                className="w-full"
              >
                Ir para Dashboard
              </Button>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-md">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-yellow-900">Link expirado</h3>
              <p className="text-sm text-muted-foreground">
                O link de verificação expirou. Solicite um novo link abaixo.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={resendVerification} className="w-full">
                <Mail className="mr-2 w-4 h-4" />
                Reenviar verificação
              </Button>

              <Button
                onClick={() => router.push(ROUTES.login)}
                variant="outline"
                className="w-full"
              >
                Voltar ao login
              </Button>
            </div>
          </div>
        );

      case "error":
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-md">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-red-900">Erro na verificação</h3>
              <p className="text-sm text-muted-foreground">
                Link de verificação inválido ou já utilizado.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => router.push(ROUTES.register)}
                className="w-full"
              >
                Criar nova conta
              </Button>

              <Button
                onClick={() => router.push(ROUTES.login)}
                variant="outline"
                className="w-full"
              >
                Fazer login
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Fradema</h1>
          <p className="mt-2 text-muted-foreground">Consultoria Tributária</p>
        </div>

        {/* Card de Verificação */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Mail className="w-6 h-6" />
              Verificação de Email
            </CardTitle>
            <CardDescription className="text-center">
              {status === "verifying" && "Processando sua verificação..."}
              {status === "success" && "Sua conta foi verificada com sucesso!"}
              {status === "expired" && "Link de verificação expirado"}
              {status === "error" && "Erro ao verificar email"}
            </CardDescription>
          </CardHeader>

          <CardContent>{renderContent()}</CardContent>
        </Card>

        {/* Informações adicionais */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Problemas com a verificação? Entre em contato com o suporte.
          </p>
          {status === "success" && (
            <p className="text-xs text-muted-foreground">
              Você já pode acessar todos os recursos da plataforma.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
