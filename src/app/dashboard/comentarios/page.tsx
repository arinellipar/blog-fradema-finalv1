"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import Link from "next/link";

interface PendingComment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  replies?: PendingComment[];
}

export default function ComentariosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [pendingComments, setPendingComments] = React.useState<
    PendingComment[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      router.push("/dashboard");
      return;
    }

    loadPendingComments();
  }, [user, authLoading, router]);

  const loadPendingComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/comments/pending");
      const data = await response.json();

      if (response.ok) {
        setPendingComments(
          data.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
          }))
        );
      } else {
        throw new Error(data.error || "Erro ao carregar comentários");
      }
    } catch (error) {
      console.error("Erro ao carregar comentários pendentes:", error);
      toast({
        title: "Erro ao carregar comentários",
        description: "Não foi possível carregar os comentários pendentes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    setIsProcessing(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}/approve`, {
        method: "PUT",
      });

      if (response.ok) {
        toast({
          title: "Comentário aprovado!",
          description: "O comentário foi aprovado e publicado",
        });
        await loadPendingComments();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao aprovar comentário");
      }
    } catch (error) {
      toast({
        title: "Erro ao aprovar comentário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (commentId: string) => {
    setIsProcessing(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}/approve`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Comentário rejeitado!",
          description: "O comentário foi rejeitado e removido",
        });
        await loadPendingComments();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao rejeitar comentário");
      }
    } catch (error) {
      toast({
        title: "Erro ao rejeitar comentário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Moderação de Comentários</h1>
          <Badge variant="secondary" className="ml-2">
            {pendingComments.length} pendentes
          </Badge>
        </div>

        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {pendingComments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhum comentário pendente
            </h2>
            <p className="text-muted-foreground">
              Todos os comentários foram revisados e aprovados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingComments.map((comment) => (
            <Card key={comment.id} className="border-yellow-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>
                        {comment.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{comment.author.name}</h3>
                        <Badge variant="outline">{comment.author.role}</Badge>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/blog/${comment.post.slug}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Post
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Post:</h4>
                  <Link
                    href={`/blog/${comment.post.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {comment.post.title}
                  </Link>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-2">Comentário:</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {comment.content}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApprove(comment.id)}
                    disabled={isProcessing === comment.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing === comment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(comment.id)}
                    disabled={isProcessing === comment.id}
                  >
                    {isProcessing === comment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
