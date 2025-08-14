"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircleIcon, ReplyIcon, UserIcon } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  date: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
}

export function CommentSection({
  postId,
  comments: initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar comentários da API
  React.useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/comments?postId=${postId}`);

        if (!response.ok) {
          throw new Error("Erro ao carregar comentários");
        }

        const apiComments = await response.json();

        // Converter comentários da API para o formato esperado
        const convertedComments: Comment[] = apiComments.map((comment: any) => ({
          id: comment.id,
          author: comment.author.name,
          avatar: comment.author.avatar,
          content: comment.content,
          date: comment.createdAt,
          replies: comment.replies?.map((reply: any) => ({
            id: reply.id,
            author: reply.author.name,
            avatar: reply.author.avatar,
            content: reply.content,
            date: reply.createdAt,
          })) || [],
        }));

        setComments(convertedComments);
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [postId]);
  const [newComment, setNewComment] = useState({
    content: "",
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.content,
          postId: postId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar comentário");
      }

      const newCommentData = await response.json();

      // Converter para o formato esperado pelo componente
      const comment: Comment = {
        id: newCommentData.id,
        author: newCommentData.author.name,
        avatar: newCommentData.author.avatar,
        content: newCommentData.content,
        date: newCommentData.createdAt,
        replies: [],
      };

      setComments((prev) => [comment, ...prev]);
      setNewComment({ author: "", content: "" });

      console.log("Comentário adicionado:", comment);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      alert("Erro ao adicionar comentário. Verifique se você está logado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          postId: postId,
          parentId: parentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar resposta");
      }

      const newReplyData = await response.json();

      // Converter para o formato esperado pelo componente
      const reply: Comment = {
        id: newReplyData.id,
        author: newReplyData.author.name,
        avatar: newReplyData.author.avatar,
        content: newReplyData.content,
        date: newReplyData.createdAt,
      };

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
            };
          }
          return comment;
        })
      );

      setReplyContent("");
      setReplyingTo(null);

      console.log("Resposta adicionada:", reply);
    } catch (error) {
      console.error("Erro ao adicionar resposta:", error);
      alert("Erro ao adicionar resposta. Verifique se você está logado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={`${isReply ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.avatar} alt={comment.author} />
          <AvatarFallback>
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author}</span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.date)}
            </span>
          </div>

          <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>

          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ReplyIcon className="h-3 w-3" />
              Responder
            </button>
          )}

          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  {isSubmitting ? "Enviando..." : "Responder"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleIcon className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commentContent">Comentário</Label>
            <Textarea
              id="commentContent"
              placeholder="Escreva seu comentário..."
              value={newComment.content}
              onChange={(e) =>
                setNewComment((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !newComment.content.trim()
            }
          >
            {isSubmitting ? "Enviando..." : "Publicar Comentário"}
          </Button>
        </form>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>Carregando comentários...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6 border-t pt-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Seja o primeiro a comentar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
