// src/app/auth/register/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/utils";
import { AuthError, AuthErrorCode } from "@/types/auth";

// Schema de validação
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),

    email: z.string().email("Email inválido").max(254, "Email muito longo"),

    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa"),
    confirmPassword: z.string(),

    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "Você deve aceitar os termos de uso"),

    newsletterOptIn: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Estados do componente
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Configuração do formulário
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      newsletterOptIn: false,
    },
  });

  // Watch para validação em tempo real
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Verificar força da senha
  const passwordStrength = React.useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    const strengthMap = {
      0: { label: "", color: "" },
      1: { label: "Muito fraca", color: "bg-red-500" },
      2: { label: "Fraca", color: "bg-red-400" },
      3: { label: "Razoável", color: "bg-yellow-500" },
      4: { label: "Boa", color: "bg-blue-500" },
      5: { label: "Excelente", color: "bg-green-500" },
    };

    return strengthMap[score as keyof typeof strengthMap];
  }, [password]);

  // Verificar compatibilidade de senhas
  const passwordsMatch = React.useMemo(() => {
    if (!password || !confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Handler de submissão
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      await registerUser({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
        newsletterOptIn: data.newsletterOptIn,
      });

      toast.success("Conta criada com sucesso!", {
        description: "Bem-vindo ao Fradema! Você já está logado.",
      });

      // A navegação é feita automaticamente pelo contexto de auth
    } catch (error) {
      const authError = error as AuthError;

      // Mapear erros específicos para campos
      if (authError.code === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
        setError("email", {
          type: "manual",
          message: authError.message,
        });
      } else if (authError.code === AuthErrorCode.WEAK_PASSWORD) {
        setError("password", {
          type: "manual",
          message: authError.message,
        });
      } else if (authError.field) {
        setError(authError.field as keyof RegisterFormData, {
          type: "manual",
          message: authError.message,
        });
      } else {
        toast.error("Erro no cadastro", {
          description:
            authError.message || "Tente novamente em alguns instantes",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animações
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
      />

      <motion.div {...fadeInUp} className="relative w-full max-w-md mx-auto">
        <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Criar Conta
              </CardTitle>
              <CardDescription>
                Junte-se à Fradema e tenha acesso a conteúdo exclusivo
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.form
              variants={staggerContainer}
              animate="animate"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Nome */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name.message}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Senha */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{
                            width: `${(passwordStrength.label ? 1 : 0) * 100}%`,
                          }}
                        />
                      </div>
                      {passwordStrength.label && (
                        <span className="text-xs font-medium">
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Confirmar Senha */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirmar senha *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : passwordsMatch === false
                        ? "border-red-500"
                        : passwordsMatch === true
                        ? "border-green-500"
                        : ""
                    }`}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {passwordsMatch === true && confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Senhas coincidem
                  </p>
                )}

                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </motion.div>

              {/* Termos de uso */}
              <motion.div variants={fadeInUp} className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("acceptTerms")}
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm text-gray-600"
                  >
                    Eu aceito os{" "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Política de Privacidade
                    </Link>{" "}
                    *
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    id="newsletterOptIn"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("newsletterOptIn")}
                  />
                  <Label
                    htmlFor="newsletterOptIn"
                    className="text-sm text-gray-600"
                  >
                    Quero receber atualizações sobre tributação e novidades da
                    Fradema
                  </Label>
                </div>

                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.acceptTerms.message}
                  </p>
                )}
              </motion.div>

              {/* Botão de submit */}
              <motion.div variants={fadeInUp} className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={isSubmitting || !isValid}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar conta
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Links de navegação */}
            <motion.div
              variants={fadeInUp}
              className="space-y-4 pt-4 border-t border-gray-200"
            >
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <Link
                    href={ROUTES.login}
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <Button variant="ghost" asChild size="sm">
                  <Link href={ROUTES.home}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao início
                  </Link>
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-sm text-gray-600"
        >
          <p>
            Ao criar uma conta, você terá acesso a conteúdo exclusivo sobre
            tributação e consultoria fiscal.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
