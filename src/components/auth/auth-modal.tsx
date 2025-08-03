/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/auth-modal.tsx

"use client";

import * as React from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { JSX } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptTerms: boolean;
  newsletterOptIn: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps): JSX.Element | null {
  const [mode, setMode] = React.useState<"login" | "register">(defaultMode);
  const [isLoading, setIsLoading] = React.useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [formState, setFormState] = React.useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    acceptTerms: false,
    newsletterOptIn: false,
    showPassword: false,
    showConfirmPassword: false,
    errors: {},
    touched: {},
  });

  // Reset form when mode changes
  React.useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      errors: {},
      touched: {},
      confirmPassword: "",
      name: "",
      acceptTerms: false,
      newsletterOptIn: false,
    }));
  }, [mode]);

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const validateEmail = (email: string): string | null => {
    if (!email) return "Email é obrigatório";
    if (!isValidEmail(email)) return "Email inválido";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Senha é obrigatória";
    if (mode === "register") {
      if (password.length < 8) return "Senha deve ter pelo menos 8 caracteres";
      if (!/[A-Z]/.test(password))
        return "Senha deve conter pelo menos uma letra maiúscula";
      if (!/[a-z]/.test(password))
        return "Senha deve conter pelo menos uma letra minúscula";
      if (!/\d/.test(password)) return "Senha deve conter pelo menos um número";
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        return "Senha deve conter pelo menos um caractere especial";
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name.trim()) return "Nome é obrigatório";
    if (name.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
    return null;
  };

  const handleFieldChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: {
        ...prev.errors,
        [field]: prev.touched[field]
          ? validateField(field, value) || ""
          : prev.errors[field],
      },
    }));
  };

  const handleFieldBlur = (field: keyof FormState) => {
    const value = formState[field];
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
      errors: {
        ...prev.errors,
        [field]: validateField(field, value as string | boolean) || "",
      },
    }));
  };

  const validateField = (
    field: keyof FormState,
    value: string | boolean
  ): string | null => {
    switch (field) {
      case "email":
        return validateEmail(value as string);
      case "password":
        return validatePassword(value as string);
      case "confirmPassword":
        if (mode === "register") {
          if (!value) return "Confirmação de senha é obrigatória";
          if (value !== formState.password) return "As senhas não coincidem";
        }
        return null;
      case "name":
        if (mode === "register") return validateName(value as string);
        return null;
      case "acceptTerms":
        if (mode === "register" && !value) return "Você deve aceitar os termos";
        return null;
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const fields =
      mode === "login"
        ? ["email", "password"]
        : ["email", "password", "confirmPassword", "name", "acceptTerms"];

    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const fieldValue = formState[field as keyof FormState];
      const error = validateField(
        field as keyof FormState,
        fieldValue as string | boolean
      );
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
      touched: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    }));

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login({
          email: formState.email,
          password: formState.password,
        });

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
          variant: "success" as any,
        });
      } else {
        await register({
          email: formState.email,
          password: formState.password,
          confirmPassword: formState.confirmPassword,
          name: formState.name,
          acceptTerms: formState.acceptTerms,
          newsletterOptIn: formState.newsletterOptIn,
        });

        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo! Verifique seu email para ativação.",
          variant: "success" as any,
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Erro no login" : "Erro no cadastro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>

          <CardTitle className="text-center">
            {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome (apenas registro) */}
            {mode === "register" && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formState.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    disabled={isLoading}
                    error={!!formState.errors.name}
                    errorMessage={formState.errors.name}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
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
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={formState.showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formState.password}
                  onChange={(e) =>
                    handleFieldChange("password", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("password")}
                  disabled={isLoading}
                  error={!!formState.errors.password}
                  errorMessage={formState.errors.password}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleFieldChange("showPassword", !formState.showPassword)
                  }
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
            </div>

            {/* Confirmar Senha (apenas registro) */}
            {mode === "register" && (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={formState.showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formState.confirmPassword}
                    onChange={(e) =>
                      handleFieldChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    disabled={isLoading}
                    error={!!formState.errors.confirmPassword}
                    errorMessage={formState.errors.confirmPassword}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleFieldChange(
                        "showConfirmPassword",
                        !formState.showConfirmPassword
                      )
                    }
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
            )}

            {/* Checkboxes (apenas registro) */}
            {mode === "register" && (
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
                    Concordo com os Termos de Uso e Política de Privacidade
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
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>

            {/* Toggle Mode */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "login"
                  ? "Não tem uma conta? "
                  : "Já tem uma conta? "}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                disabled={isLoading}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Criar conta" : "Fazer login"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
