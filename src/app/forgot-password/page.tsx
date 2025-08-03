// src/app/forgot-password/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle,
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
import { useToast } from "@/hooks/use-toast";
import { isValidEmail, ROUTES } from "@/lib/utils";

/**
 * Estados do formulário de recuperação de senha
 */
interface ForgotPasswordState {
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  touched: boolean;
}

/**
 * Página de Recuperação de Senha
 * Permite ao usuário solicitar um reset de senha via email
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Estado do formulário
  const [state, setState] = React.useState<ForgotPasswordState>({
    email: "",
    isLoading: false,
    isSuccess: false,
    error: null,
    touched: false,
  });

  /**
   * Valida o email inserido
   */
  const validateEmail = React.useCallback((email: string): string | null => {
    if (!email) {
      return "Email é obrigatório";
    }

    if (!isValidEmail(email)) {
      return "Email inválido";
    }

    return null;
  }, []);

  /**
   * Handler de mudança do campo email
   */
  const handleEmailChange = React.useCallback(
    (value: string) => {
      setState((prev) => ({
        ...prev,
        email: value,
        error: prev.touched ? validateEmail(value) : null,
      }));
    },
    [validateEmail]
  );

  /**
   * Handler de blur do campo email
   */
  const handleEmailBlur = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      touched: true,
      error: validateEmail(prev.email),
    }));
  }, [validateEmail]);

  /**
   * Handler de submissão do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(state.email);
    if (emailError) {
      setState((prev) => ({
        ...prev,
        error: emailError,
        touched: true,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isSuccess: true,
          isLoading: false,
        }));

        toast({
          title: "Email enviado!",
          description:
            "Verifique sua caixa de entrada para instruções de reset.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          variant: "success" as any,
        });
      } else {
        setState((prev) => ({
          ...prev,
          error: data.error?.message || "Erro ao enviar email",
          isLoading: false,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Erro de conexão. Tente novamente.",
        isLoading: false,
      }));
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

        {/* Card de Recuperação */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Recuperar senha
            </CardTitle>
            <CardDescription className="text-center">
              {state.isSuccess
                ? "Instruções enviadas para seu email"
                : "Digite seu email para receber instruções de recuperação"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {state.isSuccess ? (
              // Estado de sucesso
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enviamos instruções para redefinir sua senha para:
                  </p>
                  <p className="font-medium">{state.email}</p>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada e siga as instruções no
                    email.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Não recebeu o email? Verifique sua pasta de spam.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() =>
                      setState((prev) => ({ ...prev, isSuccess: false }))
                    }
                    variant="outline"
                    className="w-full"
                  >
                    Tentar outro email
                  </Button>

                  <Button
                    onClick={() => router.push(ROUTES.login)}
                    className="w-full"
                  >
                    Voltar ao login
                  </Button>
                </div>
              </div>
            ) : (
              // Formulário de recuperação
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Erro geral */}
                {state.error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                )}

                {/* Campo de Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={state.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      disabled={state.isLoading}
                      error={!!state.error}
                      className="pl-10"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Botão de Submit */}
                <Button
                  type="submit"
                  disabled={state.isLoading || !!state.error}
                  className="w-full"
                  size="lg"
                >
                  {state.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar instruções
                    </>
                  )}
                </Button>

                {/* Link para voltar ao login */}
                <div className="text-center">
                  <Link
                    href={ROUTES.login}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
