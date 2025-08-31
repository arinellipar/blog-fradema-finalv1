// src/components/blog/comments.tsx

"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  Edit3,
  Trash2,
  Reply,
  ChevronDown,
  ChevronUp,
  LogIn,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";

interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  replies?: Comment[];
}

interface CommentsProps {
  postId: string;
  postTitle?: string;
}

export function Comments({ postId, postTitle }: CommentsProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Estados
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState("");
  const [editingComment, setEditingComment] = React.useState<string | null>(
    null
  );
  const [editContent, setEditContent] = React.useState("");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(
    null
  );
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(
    new Set()
  );
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);

  // Carregar comentários
  React.useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?postId=${postId}`);
      const data = await response.json();

      if (response.ok) {
        // Organizar comentários em estrutura hierárquica
        const commentsMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // Primeiro, mapear todos os comentários
        // A API retorna os comentários diretamente como array
        const commentsArray = Array.isArray(data) ? data : [];

        commentsArray.forEach((comment: any) => {
          commentsMap.set(comment.id, {
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
            replies: [],
          });
        });

        // Depois, organizar hierarquia
        commentsMap.forEach((comment) => {
          if (comment.parentId) {
            const parent = commentsMap.get(comment.parentId);
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });

        // Filtrar apenas comentários aprovados
        const approvedComments = rootComments.filter(
          (comment) => comment.approved
        );

        // Ordenar por data (mais recentes primeiro)
        approvedComments.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        setComments(approvedComments);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      toast({
        title: "Erro ao carregar comentários",
        description: "Não foi possível carregar os comentários",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Enviar comentário
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, escreva algo antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          postId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment("");
        await loadComments();

        toast({
          title: "Comentário enviado!",
          description: data.message || "Comentário enviado com sucesso",
        });
      } else {
        throw new Error(data.error?.message || "Erro ao enviar comentário");
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      toast({
        title: "Erro ao enviar comentário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Responder comentário
  const handleReply = async (parentId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Resposta vazia",
        description: "Por favor, escreva algo antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          postId,
          parentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        await loadComments();

        toast({
          title: "Resposta enviada!",
          description: data.message || "Resposta enviada com sucesso",
        });
      } else {
        throw new Error(data.error?.message || "Erro ao enviar resposta");
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar resposta",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar comentário
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, escreva algo antes de salvar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implementar API de edição de comentários
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A edição de comentários será implementada em breve",
      });
      setEditContent("");
      setEditingComment(null);
    } catch (error) {
      toast({
        title: "Erro ao editar comentário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deletar comentário
  const handleDelete = async (commentId: string) => {
    setIsSubmitting(true);

    try {
      // TODO: Implementar API de exclusão de comentários
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A exclusão de comentários será implementada em breve",
      });
      setDeleteConfirmId(null);
    } catch (error) {
      toast({
        title: "Erro ao remover comentário",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle expandir respostas
  const toggleExpanded = (commentId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Pode editar/deletar comentário
  const canModifyComment = (comment: Comment): boolean => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.EDITOR) return true;
    return comment.authorId === user.id;
  };

  // Renderizar comentário
  const renderComment = (comment: Comment, level: number = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`${level > 0 ? "ml-8 mt-4" : "mb-6"}`}>
        <Card className={`${!comment.approved ? "opacity-75" : ""}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
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

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{comment.author.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(comment.createdAt)}
                      {comment.updatedAt > comment.createdAt && (
                        <span className="ml-2">(editado)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!comment.approved && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Aguardando moderação</span>
                      </div>
                    )}

                    {canModifyComment(comment) && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Edite seu comentário..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent("");
                        }}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-4 mt-4">
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(comment.id);
                          setReplyContent("");
                        }}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Responder
                      </Button>
                    )}

                    {hasReplies && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(comment.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Ocultar respostas ({comment.replies!.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Ver respostas ({comment.replies!.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {isReplying && (
                  <div className="mt-4">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Responder"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {hasReplies && isExpanded && (
          <div className="mt-2">
            {comment.replies!.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Contar total de comentários
  const countComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countComments(comments);

  if (authLoading || isLoadingComments) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Carregando comentários...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-xl font-semibold">Comentários ({totalComments})</h3>
      </div>

      {/* Seção de comentários pendentes para administradores */}
      {user?.role === UserRole.ADMIN && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">
              Comentários Pendentes
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Comentários aguardando aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700">
              <p>Esta seção é visível apenas para administradores.</p>
              <p>
                Comentários de usuários normais precisam ser aprovados antes de
                aparecerem publicamente.
              </p>
              <p className="mt-2 font-medium">
                💡 Dica: Acesse o dashboard para gerenciar comentários
                pendentes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de novo comentário */}
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deixe seu comentário</CardTitle>
            <CardDescription>
              Compartilhe sua opinião sobre este artigo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComment}>
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva seu comentário..."
                    rows={4}
                    disabled={isSubmitting}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Comentários passam por moderação antes de serem publicados
                    </p>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              Faça login para comentar
            </h4>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Você precisa estar logado para deixar comentários e interagir com
              outros leitores
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/login?redirect=/blog/${postId}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Fazer Login
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Criar Conta</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de comentários */}
      {totalComments > 0 ? (
        <div className="space-y-4">
          {comments
            .filter(
              (comment) => comment.approved || comment.authorId === user?.id
            )
            .map((comment) => renderComment(comment))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">
              Nenhum comentário ainda
            </h4>
            <p className="text-muted-foreground max-w-sm">
              Seja o primeiro a comentar neste artigo!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este comentário? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de prompt de login */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login necessário</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisa estar logado para comentar neste artigo. Faça login
              ou crie uma conta gratuita para participar da discussão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={`/login?redirect=/blog/${postId}`}>Fazer Login</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
