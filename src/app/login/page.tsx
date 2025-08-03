"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LoginPayload, AuthErrorCode } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn, isValidEmail, ROUTES } from "@/lib/utils";

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
  touched: {
    email: boolean;
    password: boolean;
  };
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const;

const floatingAnimation = {
  y: [-10, 10, -10],
  rotate: [0, 5, -5, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [formState, setFormState] = React.useState<LoginFormState>({
    email: "",
    password: "",
    rememberMe: false,
    showPassword: false,
    errors: {},
    touched: { email: false, password: false },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attemptCount, setAttemptCount] = React.useState(0);
  const [isRateLimited, setIsRateLimited] = React.useState(false);

  const handleInputChange = (
    field: keyof LoginFormState,
    value: string | boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }));
  };

  const handleInputBlur = (field: "email" | "password") => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email é obrigatório";
    if (!isValidEmail(email)) return "Email inválido";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Senha é obrigatória";
    if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    if (emailError || passwordError) {
      setFormState((prev) => ({
        ...prev,
        errors: {
          email: emailError,
          password: passwordError,
        },
        touched: { email: true, password: true },
      }));

      toast.error("Verifique os campos", {
        description: "Corrija os erros no formulário",
      });

      return false;
    }

    return true;
  };

  const resendVerificationEmail = async (email: string) => {
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Erro ao reenviar email");
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isRateLimited) {
      toast.warning("Muitas tentativas", {
        description: "Aguarde alguns minutos antes de tentar novamente",
      });
      return;
    }

    setIsSubmitting(true);
    setFormState((prev) => ({ ...prev, errors: {} }));

    try {
      const payload: LoginPayload = {
        email: formState.email.trim().toLowerCase(),
        password: formState.password,
        rememberMe: formState.rememberMe,
      };

      await login(payload);

      toast.success("Login realizado", {
        description: "Bem-vindo de volta!",
      });

      setAttemptCount(0);
      // Redirecionamento agora é gerenciado pelo useAuth.login()
    } catch (error: unknown) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= 5) {
        setIsRateLimited(true);
        setTimeout(() => {
          setIsRateLimited(false);
          setAttemptCount(0);
        }, 5 * 60 * 1000);
      }

      const errorCode = (error as { code?: AuthErrorCode })?.code;

      switch (errorCode) {
        case AuthErrorCode.INVALID_CREDENTIALS:
          setFormState((prev) => ({
            ...prev,
            errors: { general: "Email ou senha incorretos" },
          }));
          toast.error("Credenciais inválidas", {
            description: "Verifique seu email e senha",
          });
          break;

        case AuthErrorCode.EMAIL_NOT_VERIFIED:
          setFormState((prev) => ({
            ...prev,
            errors: {
              general: "Por favor, verifique seu email antes de fazer login",
            },
          }));
          toast.warning("Email não verificado", {
            description: "Verifique sua caixa de entrada",
            action: {
              label: "Reenviar",
              onClick: () => {
                toast.promise(resendVerificationEmail(formState.email), {
                  loading: "Reenviando email...",
                  success: "Email de verificação enviado!",
                  error: "Erro ao reenviar email",
                });
              },
            },
          });
          break;

        case AuthErrorCode.ACCOUNT_DISABLED:
          toast.error("Conta desativada", {
            description: "Entre em contato com o suporte",
            action: {
              label: "Contato",
              onClick: () => router.push("/contato"),
            },
          });
          break;

        default:
          toast.error("Erro no login", {
            description: "Tente novamente em alguns instantes",
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={floatingAnimation}
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 2 },
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
            transition: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            },
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="absolute top-4 left-4 z-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Button>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Logo/Brand Section */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Faça login para acessar sua conta
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            variants={itemVariants}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              <AnimatePresence>
                {formState.errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{formState.errors.general}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formState.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      onBlur={() => handleInputBlur("email")}
                      className={cn(
                        "pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200",
                        formState.errors.email &&
                          formState.touched.email &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {formState.errors.email && formState.touched.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {formState.errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Input
                      id="password"
                      type={formState.showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formState.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      onBlur={() => handleInputBlur("password")}
                      className={cn(
                        "pl-10 pr-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200",
                        formState.errors.password &&
                          formState.touched.password &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() =>
                      handleInputChange("showPassword", !formState.showPassword)
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {formState.showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {formState.errors.password && formState.touched.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {formState.errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.rememberMe}
                    onChange={(e) =>
                      handleInputChange("rememberMe", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Lembrar de mim
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting || isRateLimited}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Entrar</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>

            {/* Register Link */}
            <motion.div variants={itemVariants} className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Cadastre-se
                </Link>
              </p>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ao fazer login, você concorda com nossos{" "}
              <Link
                href="/terms"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Política de Privacidade
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Fazendo login...
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
