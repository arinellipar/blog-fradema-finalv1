// src/app/reset-password/reset-password-form.tsx

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  KeyRound,
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
import { cn, ROUTES } from "@/lib/utils";

/**
 * Interface para critérios de validação de senha
 */
interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

/**
 * Estado do formulário de reset de senha
 */
interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  touched: {
    password: boolean;
    confirmPassword: boolean;
  };
}

/**
 * Componente de formulário de reset de senha
 * Permite ao usuário redefinir sua senha usando um token
 */
export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get("token");

  // Estado do formulário
  const [state, setState] = React.useState<ResetPasswordState>({
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    isSuccess: false,
    error: null,
    touched: {
      password: false,
      confirmPassword: false,
    },
  });

  // Critérios de senha
  const [passwordCriteria, setPasswordCriteria] =
    React.useState<PasswordCriteria>({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });

  // Redireciona se não há token
  React.useEffect(() => {
    if (!token) {
      toast({
        title: "Token inválido",
        description: "Link de recuperação inválido ou expirado",
        variant: "destructive",
      });
      router.push(ROUTES.login);
    }
  }, [token, router, toast]);

  /**
   * Valida senha com critérios de segurança
   */
  const validatePassword = React.useCallback(
    (password: string): string | null => {
      if (!password) {
        return "Nova senha é obrigatória";
      }

      const criteria: PasswordCriteria = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      setPasswordCriteria(criteria);

      if (!criteria.length) {
        return "Senha deve ter pelo menos 8 caracteres";
      }

      if (!criteria.uppercase) {
        return "Senha deve conter pelo menos uma letra maiúscula";
      }

      if (!criteria.lowercase) {
        return "Senha deve conter pelo menos uma letra minúscula";
      }

      if (!criteria.number) {
        return "Senha deve conter pelo menos um número";
      }

      if (!criteria.special) {
        return "Senha deve conter pelo menos um caractere especial";
      }

      return null;
    },
    []
  );

  /**
   * Valida confirmação de senha
   */
  const validateConfirmPassword = React.useCallback(
    (confirmPassword: string, password: string): string | null => {
      if (!confirmPassword) {
        return "Confirmação de senha é obrigatória";
      }

      if (confirmPassword !== password) {
        return "As senhas não coincidem";
      }

      return null;
    },
    []
  );

  /**
   * Handler de mudança de campo
   */
  const handleFieldChange = React.useCallback(
    (field: keyof ResetPasswordState, value: string | boolean) => {
      setState((prev) => {
        const newState = { ...prev, [field]: value };

        // Validação condicional se campo foi tocado
        if (prev.touched[field as keyof typeof prev.touched]) {
          if (field === "password") {
            newState.error = validatePassword(value as string);
            // Revalida confirmação se já foi preenchida
            if (prev.confirmPassword && prev.touched.confirmPassword) {
              const confirmError = validateConfirmPassword(
                prev.confirmPassword,
                value as string
              );
              if (confirmError) newState.error = confirmError;
            }
          } else if (field === "confirmPassword") {
            newState.error = validateConfirmPassword(
              value as string,
              prev.password
            );
          }
        }

        return newState;
      });
    },
    [validatePassword, validateConfirmPassword]
  );

  /**
   * Handler de blur para marcar campo como touched
   */
  const handleFieldBlur = React.useCallback(
    (field: keyof ResetPasswordState) => {
      setState((prev) => {
        const value = prev[field];
        let error: string | null = null;

        if (field === "password") {
          error = validatePassword(value as string);
        } else if (field === "confirmPassword") {
          error = validateConfirmPassword(value as string, prev.password);
        }

        return {
          ...prev,
          touched: {
            ...prev.touched,
            [field]: true,
          },
          error,
        };
      });
    },
    [validatePassword, validateConfirmPassword]
  );

  /**
   * Handler de submissão do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    // Validação final
    const passwordError = validatePassword(state.password);
    const confirmPasswordError = validateConfirmPassword(
      state.confirmPassword,
      state.password
    );

    if (passwordError || confirmPasswordError) {
      setState((prev) => ({
        ...prev,
        error: passwordError || confirmPasswordError,
        touched: {
          password: true,
          confirmPassword: true,
        },
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: state.password,
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
          title: "Senha redefinida!",
          description: "Sua senha foi atualizada com sucesso.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          variant: "success" as any,
        });

        // Redireciona para login após 2 segundos
        setTimeout(() => {
          router.push(ROUTES.login);
        }, 2000);
      } else {
        setState((prev) => ({
          ...prev,
          error: data.error?.message || "Erro ao redefinir senha",
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Erro de conexão. Tente novamente.",
        isLoading: false,
      }));
    }
  };

  /**
   * Toggle de visibilidade da senha
   */
  const togglePasswordVisibility = React.useCallback(
    (field: "password" | "confirmPassword") => {
      const showField =
        field === "password" ? "showPassword" : "showConfirmPassword";
      setState((prev) => ({
        ...prev,
        [showField]: !prev[showField],
      }));
    },
    []
  );

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Fradema</h1>
          <p className="mt-2 text-muted-foreground">Consultoria Tributária</p>
        </div>

        {/* Card de Reset */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <KeyRound className="w-6 h-6" />
              Redefinir senha
            </CardTitle>
            <CardDescription className="text-center">
              {state.isSuccess
                ? "Senha redefinida com sucesso!"
                : "Digite sua nova senha abaixo"}
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
                    Sua senha foi redefinida com sucesso!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecionando para o login...
                  </p>
                </div>

                <Button
                  onClick={() => router.push(ROUTES.login)}
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </div>
            ) : (
              // Formulário de reset
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

                {/* Campo Nova Senha */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={state.showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      value={state.password}
                      onChange={(e) =>
                        handleFieldChange("password", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("password")}
                      disabled={state.isLoading}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePasswordVisibility("password")}
                      disabled={state.isLoading}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    >
                      {state.showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Indicadores de critérios de senha */}
                  {state.password && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Critérios de segurança:
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            passwordCriteria.length
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" />
                          8+ caracteres
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            passwordCriteria.uppercase
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Maiúscula
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            passwordCriteria.lowercase
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Minúscula
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            passwordCriteria.number
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Número
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 col-span-2",
                            passwordCriteria.special
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Caractere especial
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo Confirmar Senha */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={state.showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      value={state.confirmPassword}
                      onChange={(e) =>
                        handleFieldChange("confirmPassword", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("confirmPassword")}
                      disabled={state.isLoading}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                      disabled={state.isLoading}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    >
                      {state.showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
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
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Redefinir senha
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Informações de segurança */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Após redefinir a senha, você será redirecionado para o login.
          </p>
          <p className="text-xs text-muted-foreground">
            Todas as sessões ativas serão encerradas por segurança.
          </p>
        </div>
      </div>
    </div>
  );
}
