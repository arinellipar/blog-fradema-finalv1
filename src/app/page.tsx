// src/app/page.tsx - Landing Page Enterprise-Grade Fradema

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Shield,
  TrendingUp,
  Users,
  Star,
  Award,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  LogIn,
  UserPlus,
  Loader2,
  Sparkles,
  Crown,
  Target,
  Building,
  Scale,
  Clock,
  TrendingDown,
  ArrowUpRight,
  Globe,
  ShieldCheck,
  MessageCircle,
  Calendar,
  Quote,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AnimatedCounter from "@/components/ui/animated-counter";

// Import hooks e utils
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";

// Tipos
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: Date;
  readingTime: number;
  thumbnail?: string;
}

interface Testimonial {
  id: string;
  content: string;
  author: {
    name: string;
    role: string;
    company: string;
    avatar?: string;
  };
  rating: number;
}

// Componente para buscar posts reais
function BlogPostsPreview() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/posts");

        if (!response.ok) {
          throw new Error("Erro ao buscar posts");
        }

        const apiPosts = await response.json();

        // Converter posts da API para o formato esperado
        const convertedPosts: BlogPost[] = apiPosts
          .slice(0, 3) // Pegar apenas os 3 primeiros posts
          .map((post: any) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || "",
            category: post.tags?.[0]?.tag?.name || "Geral",
            author: {
              name: post.author?.name || "Autor desconhecido",
              avatar: post.author?.avatar || null,
            },
            publishedAt: new Date(post.publishedAt || post.createdAt),
            readingTime: post.readingTime || 5,
            thumbnail: post.mainImage || null,
          }));

        setPosts(convertedPosts);
      } catch (error) {
        console.error("Erro ao buscar posts:", error);
        // Em caso de erro, usar posts mockados como fallback
        setPosts(MOCK_BLOG_POSTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg"></div>
            <div className="p-6 space-y-3">
              <div className="bg-gray-200 h-6 rounded"></div>
              <div className="bg-gray-200 h-4 rounded"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group cursor-pointer"
        >
          <Link href={`/blog/${post.slug}`} className="block">
            <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <Image
                width={600}
                height={300}
                src={
                  post.thumbnail ||
                  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop"
                }
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 text-gray-700 backdrop-blur">
                  {post.category}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.publishedAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{post.readingTime} min</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        </motion.article>
      ))}
    </div>
  );
}

// Dados mockados como fallback
const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Reforma Tributária 2024: Impactos e Oportunidades para Empresas",
    slug: "reforma-tributaria-2024-impactos-e-oportunidades",
    excerpt:
      "Análise completa das mudanças propostas na reforma tributária e como sua empresa pode se preparar para maximizar benefícios fiscais.",
    category: "Legislação",
    author: {
      name: "Dr. Carlos Fradema",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    publishedAt: new Date("2024-01-15"),
    readingTime: 8,
    thumbnail:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Estratégias de Planejamento Tributário para 2024",
    slug: "estrategias-de-planejamento-tributario-2024",
    excerpt:
      "Descubra as melhores práticas e estratégias legais para otimizar a carga tributária da sua empresa neste ano.",
    category: "Planejamento",
    author: {
      name: "Dra. Ana Tributária",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    publishedAt: new Date("2024-01-10"),
    readingTime: 6,
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Compliance Fiscal: Como Evitar Multas e Autuações",
    slug: "compliance-fiscal-como-evitar-multas-e-autuacoes",
    excerpt:
      "Guia completo sobre conformidade fiscal e as principais armadilhas que sua empresa deve evitar.",
    category: "Compliance",
    author: {
      name: "Dr. João Fiscal",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    publishedAt: new Date("2024-01-05"),
    readingTime: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    content:
      "A Fradema transformou completamente nossa gestão tributária. Conseguimos uma economia de 35% em impostos de forma totalmente legal. Profissionais excepcionais!",
    author: {
      name: "Roberto Silva",
      role: "CEO",
      company: "TechCorp Brasil",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    rating: 5,
  },
  {
    id: "2",
    content:
      "Expertise incomparável em planejamento tributário. A equipe da Fradema nos ajudou a reestruturar nossa operação, resultando em economia significativa e total compliance.",
    author: {
      name: "Maria Santos",
      role: "CFO",
      company: "Indústria Alpha",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    rating: 5,
  },
  {
    id: "3",
    content:
      "Parceria estratégica fundamental para nosso crescimento. A Fradema não é apenas uma consultoria, é uma extensão do nosso time financeiro.",
    author: {
      name: "Pedro Costa",
      role: "Diretor Financeiro",
      company: "Varejo Plus",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
    },
    rating: 5,
  },
];

// Componente principal
export default function ModernLandingPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Estados
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<string | null>(
    null
  );

  // Animações
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Handler newsletter
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido", {
        description: "Por favor, insira um email válido",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Inscrição realizada!", {
        description: "Você receberá nossas atualizações tributárias por email",
      });

      setEmail("");
    } catch (error) {
      toast.error("Erro na inscrição", {
        description: "Tente novamente em alguns instantes",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fradema</h1>
                <p className="text-xs text-gray-500">Consultoria Tributária</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a
                href="#servicos"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Serviços
              </a>
              <a
                href="#sobre"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Sobre
              </a>
              <a
                href="#blog"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Blog
              </a>
              <a
                href="#depoimentos"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Cases
              </a>
              <a
                href="#contato"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Contato
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-4"
                >
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Olá, {user.name?.split(" ")[0]}
                  </span>
                  {user.role === UserRole.ADMIN ? (
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Link href={ROUTES.dashboard}>
                        Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={logout}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Sair</span>
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    asChild
                    className="hidden sm:inline-flex"
                  >
                    <Link href={ROUTES.login}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Link href={ROUTES.register}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Começar Agora</span>
                      <span className="sm:hidden">Entrar</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
          className="absolute top-40 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8"
              >
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  #1 em Consultoria Tributária no Brasil
                </span>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
              >
                Transforme sua
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  Estratégia Fiscal
                </span>
                em Vantagem Competitiva
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl"
              >
                Consultoria tributária de <strong>excelência</strong> com
                soluções personalizadas que geram{" "}
                <span className="text-blue-700 font-semibold">
                  economia real
                </span>{" "}
                e segurança jurídica para sua empresa crescer com confiança.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4 mb-10 justify-center lg:justify-start"
              >
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Economia média de 35%</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">ROI garantido</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">100% Legal</span>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInUp}
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
                  className="border-2 hover:bg-gray-50"
                  asChild
                >
                  <Link href="#servicos">
                    <Calculator className="mr-2 h-5 w-5" />
                    Conheça Nossos Serviços
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl transform rotate-3"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-2xl">
                      <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter end={2500} suffix="+" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Empresas Atendidas
                      </p>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-2xl">
                      <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900">
                        R$ <AnimatedCounter end={150} suffix="M+" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Economia Gerada
                      </p>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-2xl">
                      <Shield className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter end={99.8} decimals={1} suffix="%" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Taxa de Sucesso
                      </p>
                    </div>
                    <div className="text-center p-6 bg-orange-50 rounded-2xl">
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

              {/* Floating Cards */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">35%</div>
                    <p className="text-sm text-gray-600">Redução média</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    100% Compliance
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <motion.div whileHover={{ scale: 1.05 }} className="text-center">
              <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Top 1%</p>
              <p className="text-sm text-gray-600">Consultoria no Brasil</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="text-center">
              <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">ISO 9001</p>
              <p className="text-sm text-gray-600">
                Certificação Internacional
              </p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">2.500+</p>
              <p className="text-sm text-gray-600">Clientes Satisfeitos</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="text-center">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">NPS 92</p>
              <p className="text-sm text-gray-600">Satisfação do Cliente</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 bg-white">
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
              Oferecemos um portfólio completo de serviços especializados para
              otimizar sua carga tributária e garantir total conformidade fiscal
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calculator,
                title: "Planejamento Tributário Estratégico",
                description:
                  "Desenvolvimento de estratégias personalizadas para redução legal da carga tributária com foco em resultados sustentáveis.",
                benefits: [
                  "Economia de até 40%",
                  "ROI garantido em 12 meses",
                  "Análise de riscos completa",
                ],
                color: "blue",
              },
              {
                icon: Shield,
                title: "Compliance e Gestão Fiscal",
                description:
                  "Sistema integrado de conformidade tributária com monitoramento contínuo e prevenção de riscos fiscais.",
                benefits: [
                  "Zero multas e autuações",
                  "Automação de obrigações",
                  "Relatórios em tempo real",
                ],
                color: "green",
              },
              {
                icon: BarChart3,
                title: "Consultoria Tributária Executiva",
                description:
                  "Assessoria estratégica para C-level em decisões tributárias de alto impacto e reestruturações societárias.",
                benefits: [
                  "Suporte 24/7",
                  "Análise de M&A",
                  "Due diligence fiscal",
                ],
                color: "purple",
              },
              {
                icon: Scale,
                title: "Contencioso Tributário",
                description:
                  "Defesa administrativa e judicial com alta taxa de sucesso em processos tributários complexos.",
                benefits: [
                  "95% de êxito",
                  "Equipe especializada",
                  "Acompanhamento integral",
                ],
                color: "orange",
              },
              {
                icon: Building,
                title: "Recuperação de Créditos",
                description:
                  "Identificação e recuperação de créditos tributários com análise retroativa de até 5 anos.",
                benefits: [
                  "Sem custo inicial",
                  "Success fee",
                  "Análise completa",
                ],
                color: "indigo",
              },
              {
                icon: Globe,
                title: "Internacional e Transfer Pricing",
                description:
                  "Estruturação de operações internacionais e políticas de preços de transferência em conformidade global.",
                benefits: [
                  "Compliance global",
                  "Otimização fiscal",
                  "Documentação BEPS",
                ],
                color: "pink",
              },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="h-full hover:shadow-xl transition-all duration-300 border-gray-100 cursor-pointer group"
                  onClick={() => setSelectedService(service.title)}
                >
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
                          <span className="text-sm text-gray-700">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      className="mt-4 p-0 h-auto text-blue-600 group-hover:gap-3"
                    >
                      Saiba mais
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              Blog & Insights
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Conhecimento que Transforma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Artigos especializados, análises de mercado e insights exclusivos
              para manter sua empresa sempre à frente das mudanças tributárias
            </p>
          </motion.div>

          <BlogPostsPreview />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button asChild size="lg" variant="outline">
              <Link href="/blog">
                Ver Todos os Artigos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              Depoimentos
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Histórias reais de empresas que transformaram seus resultados com
              nossa consultoria tributária especializada
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-gradient-to-br from-gray-50 to-white border-gray-100">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <Quote className="w-10 h-10 text-gray-200 mb-4" />
                    <p className="text-gray-700 mb-6 italic">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={testimonial.author.avatar} />
                        <AvatarFallback>
                          {testimonial.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {testimonial.author.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {testimonial.author.role} •{" "}
                          {testimonial.author.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para Otimizar sua Carga Tributária?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Agende uma consultoria gratuita e descubra como podemos
              transformar impostos em oportunidades de crescimento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                asChild
              >
                <Link href="/consultoria-gratuita">
                  <Calendar className="mr-2 w-5 h-5" />
                  Agendar Consultoria Gratuita
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10"
                asChild
              >
                <Link href="/calculadora-tributaria">
                  <Calculator className="mr-2 w-5 h-5" />
                  Calculadora de Economia
                </Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div>
                <p className="text-3xl font-bold text-white">35%</p>
                <p className="text-blue-100">Economia Média</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">24h</p>
                <p className="text-blue-100">Resposta Rápida</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-blue-100">Confidencial</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
                Newsletter Exclusiva
              </Badge>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Intelligence Tributária Semanal
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Receba análises exclusivas, mudanças na legislação e
                oportunidades de economia fiscal diretamente no seu email
              </p>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="max-w-md mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inscrevendo...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Inscrever-se
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                <Shield className="w-3 h-3 inline mr-1" />
                Respeitamos sua privacidade. Cancele quando quiser.
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
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
                  <p className="text-xs text-gray-400">
                    Consultoria Tributária
                  </p>
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
                    href="#servicos"
                    className="hover:text-white transition-colors"
                  >
                    Nossos Serviços
                  </a>
                </li>
                <li>
                  <a
                    href="#sobre"
                    className="hover:text-white transition-colors"
                  >
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog & Insights
                  </a>
                </li>
                <li>
                  <a
                    href="#depoimentos"
                    className="hover:text-white transition-colors"
                  >
                    Cases de Sucesso
                  </a>
                </li>
                <li>
                  <a
                    href="/carreiras"
                    className="hover:text-white transition-colors"
                  >
                    Trabalhe Conosco
                  </a>
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
                <a
                  href="/termos"
                  className="hover:text-white transition-colors"
                >
                  Termos de Uso
                </a>
                <a
                  href="/compliance"
                  className="hover:text-white transition-colors"
                >
                  Compliance
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

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

      {/* Back to Top Button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-xl"
      >
        <ArrowUpRight className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  );
}
