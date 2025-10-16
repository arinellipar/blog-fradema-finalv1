// src/app/page.tsx - Nova Landing Page Profissional com Blog Integrado

"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Menu,
  X,
  LogIn,
  UserPlus,
  Shield,
  Award,
  Users,
  BarChart3,
  Calculator,
  Scale,
  Building,
  Globe,
  CheckCircle,
  Star,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Crown,
  ShieldCheck,
  Target,
  LogOut,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlogPostList } from "@/app/blog/blog-post-list";
import AnimatedCounter from "@/components/ui/animated-counter";
import { SmoothScrollHandler } from "@/components/ui/smooth-scroll";

// Import hooks e utils
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";

// Professional Header Component
function ProfessionalHeader() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();

  const navigation = [
    { name: "Início", href: "#hero" },
    { name: "Serviços", href: "#services" },
    { name: "Blog", href: "#blog" },
    { name: "Sobre", href: "#about" },
    { name: "Contato", href: "#contact" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50 border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Fradema</h1>
              <p className="text-xs text-gray-500">Consultoria Tributária</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                        {user.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user.name?.split(" ")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  {user.role === UserRole.ADMIN && (
                    <DropdownMenuItem
                      onClick={() => router.push(ROUTES.dashboard)}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Dashboard Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex text-gray-600 hover:text-gray-900"
                >
                  <Link href={ROUTES.login}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  <Link href={ROUTES.register}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Cadastrar</span>
                    <span className="sm:hidden">Entrar</span>
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-100 py-4"
            >
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative pt-20 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-green-400/20 backdrop-blur-sm border border-blue-200/50 rounded-full px-6 py-2 mb-8"
            >
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                #1 em Consultoria Tributária
              </span>
              <Sparkles className="w-4 h-4 text-green-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              {" "}
              #1 em Consultoria Tributária
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                Soluções Tributárias que Transformam
              </span>
              seu Negócio
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl"
            >
              Soluções tributárias estratégicas com{" "}
              <span className="text-blue-700 font-semibold">economia real</span>{" "}
              e segurança jurídica para impulsionar o crescimento da sua
              empresa.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl transition-all"
                asChild
              >
                <Link href="/consultoria-gratuita">
                  Consultoria Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:bg-gray-50"
                asChild
              >
                <a href="#blog">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Explorar Conteúdo
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-green-600 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                    <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      <AnimatedCounter end={2500} suffix="+" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Empresas Atendidas
                    </p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                    <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      R$ <AnimatedCounter end={150} suffix="M+" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Economia Gerada
                    </p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                    <Shield className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      <AnimatedCounter end={99.8} decimals={1} suffix="%" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Taxa de Sucesso
                    </p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
                    <Award className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      <AnimatedCounter end={25} suffix="+" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Anos de Experiência
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Services Section Component
function ServicesSection() {
  const services = [
    {
      icon: Calculator,
      title: "Planejamento Tributário",
      description:
        "Estratégias personalizadas para redução legal da carga tributária.",
      benefits: ["Economia até 40%", "ROI garantido", "Análise de riscos"],
      color: "blue",
    },
    {
      icon: Shield,
      title: "Compliance Fiscal",
      description:
        "Sistema integrado de conformidade com monitoramento contínuo.",
      benefits: ["Zero multas", "Automação", "Relatórios em tempo real"],
      color: "green",
    },
    {
      icon: Scale,
      title: "Contencioso Tributário",
      description: "Defesa administrativa e judicial com alta taxa de sucesso.",
      benefits: [
        "95% de êxito",
        "Equipe especializada",
        "Acompanhamento integral",
      ],
      color: "purple",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
            Nossos Serviços
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Soluções Tributárias Completas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Portfólio especializado para otimizar sua carga tributária e
            garantir total conformidade fiscal
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 border-gray-100 group">
                <CardHeader>
                  <div
                    className={`w-14 h-14 bg-gradient-to-br from-${service.color}-500 to-${service.color}-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-3">
                    {service.title}
                  </CardTitle>
                  <p className="text-gray-600">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {service.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// About Section Component
function AboutSection() {
  return (
    <section
      id="about"
      className="py-20 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              Nossa História
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              25+ Anos de Excelência em
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                Consultoria Tributária
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Há mais de 25 anos transformando desafios tributários em
              oportunidades de crescimento para empresas de todos os portes.
            </p>
            <p className="text-gray-600 mb-8">
              Nossa abordagem combina expertise técnica com tecnologia de ponta,
              oferecendo soluções personalizadas que geram economia real e
              garantem total conformidade fiscal.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  2500+
                </div>
                <p className="text-sm text-gray-600">Empresas Atendidas</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  R$ 150M+
                </div>
                <p className="text-sm text-gray-600">Economia Gerada</p>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white"
              asChild
            >
              <Link href="/consultoria-gratuita">
                Conheça Nossa Proposta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
                  <Crown className="w-8 h-8 mb-3" />
                  <h3 className="font-bold mb-2">Top 1% Brasil</h3>
                  <p className="text-sm opacity-90">Reconhecimento nacional</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white">
                  <ShieldCheck className="w-8 h-8 mb-3" />
                  <h3 className="font-bold mb-2">ISO 9001</h3>
                  <p className="text-sm opacity-90">
                    Certificação internacional
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
                  <Target className="w-8 h-8 mb-3" />
                  <h3 className="font-bold mb-2">NPS 92</h3>
                  <p className="text-sm opacity-90">Satisfação excepcional</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
                  <Users className="w-8 h-8 mb-3" />
                  <h3 className="font-bold mb-2">Time Expert</h3>
                  <p className="text-sm opacity-90">
                    Profissionais qualificados
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Blog Section Component
function BlogSection() {
  return (
    <section
      id="blog"
      className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-green-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-green-400/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 mb-8"
          >
            <Sparkles className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-white">
              Conhecimento Tributário Atualizado
            </span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative mb-6"
          >
            <span className="text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-clip-text text-transparent leading-tight block drop-shadow-2xl">
              BLOG FRADEMA
            </span>
            {/* Glow effect behind text */}
            <div className="absolute inset-0 text-6xl lg:text-7xl font-black text-blue-400/20 blur-3xl -z-10">
              BLOG FRADEMA
            </div>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl text-blue-100/80 max-w-4xl mx-auto leading-relaxed"
          >
            Fique por dentro dos principais acontecimentos do setor e novidades
            sobre a Fradema
            <span className="block mt-2 text-green-400 font-semibold">
              para manter sua empresa sempre à frente
            </span>
          </motion.p>
        </motion.div>

        {/* Blog Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8"
        >
          <BlogPostList />
        </motion.div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Fradema</h3>
                <p className="text-xs text-gray-400">Consultoria Tributária</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Há mais de 25 anos transformando desafios tributários em
              oportunidades de crescimento para empresas de todos os portes.
            </p>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-900 text-blue-200 border-blue-700">
                <Crown className="w-4 h-4 mr-1" />
                Top 1% Brasil
              </Badge>
              <Badge className="bg-green-900 text-green-200 border-green-700">
                <ShieldCheck className="w-4 h-4 mr-1" />
                ISO 9001
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="#services"
                  className="hover:text-white transition-colors"
                >
                  Nossos Serviços
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-white transition-colors">
                  Blog & Insights
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <Link
                  href="/consultoria-gratuita"
                  className="hover:text-white transition-colors"
                >
                  Consultoria Gratuita
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>(11) 3000-0000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>contato@fradema.com.br</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Fradema Consultoria Tributária. Todos os direitos
              reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a
                href="/privacidade"
                className="hover:text-white transition-colors"
              >
                Privacidade
              </a>
              <a href="/termos" className="hover:text-white transition-colors">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Component
export default function ProfessionalLandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SmoothScrollHandler />
      <ProfessionalHeader />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <BlogSection />
      <Footer />

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </motion.a>
    </div>
  );
}
