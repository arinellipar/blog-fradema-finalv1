/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/register/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { RegisterPayload, AuthErrorCode } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn, isValidEmail, ROUTES } from "@/lib/utils";

/**
 * Estado do formulário de registro
 * Gerencia valores, validações e estados visuais
 */
interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletterOptIn: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    general?: string;
  };
  touched: {
    name: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
    acceptTerms: boolean;
  };
}

/**
 * Critérios de validação de senha
 */
interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

/**
 * Página de Registro
 * Implementa criação de conta com validação avançada
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Estado inicial do formulário
  const [formState, setFormState] = React.useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    newsletterOptIn: false,
    showPassword: false,
    showConfirmPassword: false,
    errors: {},
    touched: {
      name: false,
      email: false,
      password: false,
      confirmPassword: false,
      acceptTerms: false,
    },
  });

  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Critérios de senha
  const [passwordCriteria, setPasswordCriteria] =
    React.useState<PasswordCriteria>({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });

  /**
   * Valida nome com regras de negócio
   */
  const validateName = React.useCallback((name: string): string | undefined => {
    if (!name.trim()) {
      return "Nome é obrigatório";
    }

    if (name.trim().length < 2) {
      return "Nome deve ter pelo menos 2 caracteres";
    }

    if (name.trim().length > 50) {
      return "Nome não pode ter mais de 50 caracteres";
    }

    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
      return "Nome deve conter apenas letras e espaços";
    }

    return undefined;
  }, []);

  /**
   * Valida email com regras de negócio
   */
  const validateEmail = React.useCallback(
    (email: string): string | undefined => {
      if (!email) {
        return "Email é obrigatório";
      }

      if (!isValidEmail(email)) {
        return "Email inválido";
      }

      if (email.length > 254) {
        return "Email muito longo";
      }

      return undefined;
    },
    []
  );

  /**
   * Valida senha com critérios de segurança
   */
  const validatePassword = React.useCallback(
    (password: string): string | undefined => {
      if (!password) {
        return "Senha é obrigatória";
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

      return undefined;
    },
    []
  );

  /**
   * Valida confirmação de senha
   */
  const validateConfirmPassword = React.useCallback(
    (confirmPassword: string, password: string): string | undefined => {
      if (!confirmPassword) {
        return "Confirmação de senha é obrigatória";
      }

      if (confirmPassword !== password) {
        return "As senhas não coincidem";
      }

      return undefined;
    },
    []
  );

  /**
   * Handler de mudança de campo
   */
  const handleFieldChange = React.useCallback(
    (field: keyof RegisterFormState, value: string | boolean) => {
      setFormState((prev) => {
        const newState = { ...prev, [field]: value };

        // Validação condicional apenas se campo foi tocado
        if (prev.touched[field as keyof typeof prev.touched]) {
          let error: string | undefined;

          switch (field) {
            case "name":
              error = validateName(value as string);
              break;
            case "email":
              error = validateEmail(value as string);
              break;
            case "password":
              error = validatePassword(value as string);
              // Revalida confirmação se já foi preenchida
              if (prev.confirmPassword && prev.touched.confirmPassword) {
                newState.errors.confirmPassword = validateConfirmPassword(
                  prev.confirmPassword,
                  value as string
                );
              }
              break;
            case "confirmPassword":
              error = validateConfirmPassword(value as string, prev.password);
              break;
          }

          newState.errors = {
            ...prev.errors,
            [field]: error,
          };
        }

        return newState;
      });
    },
    [validateName, validateEmail, validatePassword, validateConfirmPassword]
  );

  /**
   * Handler de blur para marcar campo como touched
   */
  const handleFieldBlur = React.useCallback(
    (field: keyof RegisterFormState) => {
      setFormState((prev) => {
        const value = prev[field];
        let error: string | undefined;

        switch (field) {
          case "name":
            error = validateName(value as string);
            break;
          case "email":
            error = validateEmail(value as string);
            break;
          case "password":
            error = validatePassword(value as string);
            break;
          case "confirmPassword":
            error = validateConfirmPassword(value as string, prev.password);
            break;
          case "acceptTerms":
            error = !(value as boolean)
              ? "Você deve aceitar os termos de uso"
              : undefined;
            break;
        }

        return {
          ...prev,
          touched: {
            ...prev.touched,
            [field]: true,
          },
          errors: {
            ...prev.errors,
            [field]: error,
          },
        };
      });
    },
    [validateName, validateEmail, validatePassword, validateConfirmPassword]
  );

  /**
   * Validação completa do formulário
   */
  const validateForm = React.useCallback((): boolean => {
    const nameError = validateName(formState.name);
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);
    const confirmPasswordError = validateConfirmPassword(
      formState.confirmPassword,
      formState.password
    );
    const acceptTermsError = !formState.acceptTerms
      ? "Você deve aceitar os termos de uso"
      : undefined;

    setFormState((prev) => ({
      ...prev,
      errors: {
        name: nameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        acceptTerms: acceptTermsError,
      },
      touched: {
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        acceptTerms: true,
      },
    }));

    return (
      !nameError &&
      !emailError &&
      !passwordError &&
      !confirmPasswordError &&
      !acceptTermsError
    );
  }, [
    formState.name,
    formState.email,
    formState.password,
    formState.confirmPassword,
    formState.acceptTerms,
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
  ]);

  /**
   * Handler de submissão do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormState((prev) => ({ ...prev, errors: {} }));

    try {
      const payload: RegisterPayload = {
        name: formState.name.trim(),
        email: formState.email.trim().toLowerCase(),
        password: formState.password,
        confirmPassword: formState.confirmPassword,
        acceptTerms: formState.acceptTerms,
        newsletterOptIn: formState.newsletterOptIn,
      };

      await register(payload);

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Fradema. Você foi redirecionado para o blog.",
        variant: "success" as any,
      });

      // O redirecionamento será gerenciado pelo contexto de autenticação
      // que redirecionará para /blog para usuários normais
    } catch (error: any) {
      console.error("❌ [REGISTER PAGE] Erro ao registrar:", error);
      const errorCode = error?.code as AuthErrorCode;

      switch (errorCode) {
        case AuthErrorCode.EMAIL_ALREADY_EXISTS:
          setFormState((prev) => ({
            ...prev,
            errors: {
              email: "Este email já está cadastrado",
            },
          }));
          break;

        case AuthErrorCode.WEAK_PASSWORD:
          setFormState((prev) => ({
            ...prev,
            errors: {
              password: error.message,
            },
          }));
          break;

        case AuthErrorCode.VALIDATION_ERROR:
          setFormState((prev) => ({
            ...prev,
            errors: {
              [error.field || "general"]: error.message,
            },
          }));
          break;

        default:
          setFormState((prev) => ({
            ...prev,
            errors: {
              general: "Erro ao criar conta. Tente novamente.",
            },
          }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle de visibilidade da senha
   */
  const togglePasswordVisibility = React.useCallback(
    (field: "password" | "confirmPassword") => {
      setFormState((prev) => ({
        ...prev,
        [`show${field.charAt(0).toUpperCase() + field.slice(1)}`]:
          !prev[
            `show${
              field.charAt(0).toUpperCase() + field.slice(1)
            }` as keyof RegisterFormState
          ],
      }));
    },
    []
  );

  /**
   * Estados derivados
   */
  const isLoading = isSubmitting || authLoading;
  const hasErrors = Object.values(formState.errors).some(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Fradema</h1>
          <p className="mt-2 text-muted-foreground">Consultoria Tributária</p>
        </div>

        {/* Card de Registro */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <UserPlus className="w-6 h-6" />
              Criar nova conta
            </CardTitle>
            <CardDescription className="text-center">
              Preencha os dados abaixo para criar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Erro geral */}
              {formState.errors.general && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formState.errors.general}</span>
                </div>
              )}

              {/* Campo Nome */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formState.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    disabled={isLoading}
                    error={!!formState.errors.name}
                    errorMessage={formState.errors.name}
                    className="pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Campo Email */}
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
                    value={formState.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    disabled={isLoading}
                    error={!!formState.errors.email}
                    errorMessage={formState.errors.email}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={formState.showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formState.password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("password")}
                    disabled={isLoading}
                    error={!!formState.errors.password}
                    errorMessage={formState.errors.password}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePasswordVisibility("password")}
                    disabled={isLoading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    {formState.showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Indicadores de critérios de senha */}
                {formState.password && (
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
                  Confirmar senha
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={formState.showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formState.confirmPassword}
                    onChange={(e) =>
                      handleFieldChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    disabled={isLoading}
                    error={!!formState.errors.confirmPassword}
                    errorMessage={formState.errors.confirmPassword}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    disabled={isLoading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    {formState.showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={formState.acceptTerms}
                    onChange={(e) =>
                      handleFieldChange("acceptTerms", e.target.checked)
                    }
                    onBlur={() => handleFieldBlur("acceptTerms")}
                    disabled={isLoading}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    required
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm text-muted-foreground"
                  >
                    Concordo com os{" "}
                    <Link
                      href="/termos"
                      className="text-primary hover:underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link
                      href="/privacidade"
                      className="text-primary hover:underline"
                    >
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
                {formState.errors.acceptTerms && (
                  <p className="text-xs text-destructive">
                    {formState.errors.acceptTerms}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    id="newsletterOptIn"
                    type="checkbox"
                    checked={formState.newsletterOptIn}
                    onChange={(e) =>
                      handleFieldChange("newsletterOptIn", e.target.checked)
                    }
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="newsletterOptIn"
                    className="text-sm text-muted-foreground"
                  >
                    Quero receber newsletter com conteúdo tributário
                  </label>
                </div>
              </div>

              {/* Botão de Submit */}
              <Button
                type="submit"
                disabled={isLoading || hasErrors}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Link para login */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link
                href={ROUTES.login}
                className="text-primary hover:underline font-medium"
              >
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-primary">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-primary">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
