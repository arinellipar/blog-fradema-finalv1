// src/components/admin/user-management.tsx

"use client";

import * as React from "react";
import {
  Users,
  Shield,
  Edit3,
  Trash2,
  Mail,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Download,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@/types/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
}

interface UserManagementProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
  currentUserId: string;
  isLoading?: boolean;
}

interface EditUserData {
  name: string;
  role: UserRole;
  emailVerified: boolean;
}

type DialogType = "edit" | "delete" | "view" | "invite";

export function UserManagement({
  users,
  onUpdateUser,
  onDeleteUser,
  onRefreshUsers,
  currentUserId,
  isLoading = false,
}: UserManagementProps) {
  const { toast } = useToast();

  // Estados do componente
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [verificationFilter, setVerificationFilter] =
    React.useState<string>("all");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<DialogType>("edit");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<EditUserData>({
    name: "",
    role: UserRole.SUBSCRIBER,
    emailVerified: false,
  });

  // Filtrar usuários baseado nos critérios
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && user.emailVerified) ||
        (verificationFilter === "unverified" && !user.emailVerified);

      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, searchTerm, roleFilter, verificationFilter]);

  // Estatísticas dos usuários
  const stats = React.useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.emailVerified).length;
    const admins = users.filter((u) => u.role === UserRole.ADMIN).length;
    const recentSignups = users.filter((u) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return u.createdAt > weekAgo;
    }).length;

    return { total, verified, admins, recentSignups };
  }, [users]);

  // Funções utilitárias
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case UserRole.EDITOR:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case UserRole.AUTHOR:
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Crown className="w-4 h-4" />;
      case UserRole.EDITOR:
        return <Edit3 className="w-4 h-4" />;
      case UserRole.AUTHOR:
        return <Edit3 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRolePriority = (role: UserRole): number => {
    switch (role) {
      case UserRole.ADMIN:
        return 4;
      case UserRole.EDITOR:
        return 3;
      case UserRole.AUTHOR:
        return 2;
      default:
        return 1;
    }
  };

  // Handlers de ação
  const openDialog = (type: DialogType, user: User) => {
    setSelectedUser(user);
    setDialogType(type);

    if (type === "edit") {
      setEditData({
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      });
    }

    setDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser || !editData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Prevenir auto-remoção de admin
    if (
      selectedUser.id === currentUserId &&
      selectedUser.role === UserRole.ADMIN &&
      editData.role !== UserRole.ADMIN
    ) {
      toast({
        title: "Ação não permitida",
        description:
          "Você não pode remover sua própria permissão de administrador",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await onUpdateUser(selectedUser.id, {
        name: editData.name.trim(),
        role: editData.role,
        emailVerified: editData.emailVerified,
      });

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso",
        variant: "default",
      });

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Validações
    if (
      userId === currentUserId &&
      user.role === UserRole.ADMIN &&
      newRole !== UserRole.ADMIN
    ) {
      toast({
        title: "Ação não permitida",
        description:
          "Você não pode remover sua própria permissão de administrador",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await onUpdateUser(userId, { role: newRole });
      toast({
        title: "Role atualizada",
        description: `Usuário promovido para ${newRole}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a role do usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode deletar sua própria conta",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await onDeleteUser(selectedUser.id);
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido do sistema com sucesso",
        variant: "default",
      });
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      [
        "Nome",
        "Email",
        "Role",
        "Email Verificado",
        "Data de Cadastro",
        "Último Login",
      ],
      ...filteredUsers.map((user) => [
        user.name,
        user.email,
        user.role,
        user.emailVerified ? "Sim" : "Não",
        formatDate(user.createdAt),
        user.lastLoginAt ? formatDate(user.lastLoginAt) : "Nunca",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Lista de usuários exportada com sucesso",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600">
            Gerencie usuários, roles e permissões do sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefreshUsers}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportUsers} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Email Verificado</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Crown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Novos (7 dias)</p>
                <p className="text-2xl font-bold">{stats.recentSignups}</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                <SelectItem value={UserRole.AUTHOR}>Autor</SelectItem>
                <SelectItem value={UserRole.SUBSCRIBER}>Assinante</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={setVerificationFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status de verificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="verified">Verificados</SelectItem>
                <SelectItem value="unverified">Não verificados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários do Sistema
            <Badge variant="secondary" className="ml-auto">
              {filteredUsers.length} usuários
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando usuários...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                              {user.id === currentUserId && (
                                <Badge variant="outline" className="text-xs">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={getRoleColor(user.role)}
                          variant="outline"
                        >
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.emailVerified ? (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {user.emailVerified
                              ? "Verificado"
                              : "Não verificado"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt ? (
                            <>
                              <div>{formatDate(user.lastLoginAt)}</div>
                              <div className="text-gray-500">
                                {user.loginCount} login
                                {user.loginCount !== 1 ? "s" : ""}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500">Nunca</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => openDialog("view", user)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openDialog("edit", user)}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Ações de role */}
                            {user.role !== UserRole.ADMIN &&
                              getRolePriority(user.role) < 4 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickRoleChange(
                                      user.id,
                                      UserRole.ADMIN
                                    )
                                  }
                                  disabled={actionLoading}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Promover a Admin
                                </DropdownMenuItem>
                              )}

                            {user.role === UserRole.ADMIN &&
                              user.id !== currentUserId && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickRoleChange(
                                      user.id,
                                      UserRole.SUBSCRIBER
                                    )
                                  }
                                  disabled={actionLoading}
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Rebaixar para Assinante
                                </DropdownMenuItem>
                              )}

                            {user.id !== currentUserId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remover Usuário
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                  <p className="text-sm mt-1">
                    Tente ajustar os filtros para encontrar usuários
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição/Visualização */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "edit" && "Editar Usuário"}
              {dialogType === "view" && "Detalhes do Usuário"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "edit" &&
                `Altere as informações de ${selectedUser?.name}. Esta ação afetará as permissões do usuário no sistema.`}
              {dialogType === "view" &&
                `Informações detalhadas de ${selectedUser?.name}.`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <Badge
                    className={getRoleColor(selectedUser.role)}
                    variant="outline"
                  >
                    {getRoleIcon(selectedUser.role)}
                    <span className="ml-1">{selectedUser.role}</span>
                  </Badge>
                </div>
              </div>

              {dialogType === "edit" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={editData.role}
                      onValueChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          role: value as UserRole,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>
                          Administrador
                        </SelectItem>
                        <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                        <SelectItem value={UserRole.AUTHOR}>Autor</SelectItem>
                        <SelectItem value={UserRole.SUBSCRIBER}>
                          Assinante
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="emailVerified"
                      type="checkbox"
                      checked={editData.emailVerified}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          emailVerified: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="emailVerified" className="text-sm">
                      Email verificado
                    </Label>
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        Status do Email
                      </p>
                      <p
                        className={
                          selectedUser.emailVerified
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {selectedUser.emailVerified
                          ? "✓ Verificado"
                          : "✗ Não verificado"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Total de Logins
                      </p>
                      <p className="text-gray-600">{selectedUser.loginCount}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cadastrado em</p>
                      <p className="text-gray-600">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Último Login</p>
                      <p className="text-gray-600">
                        {selectedUser.lastLoginAt
                          ? formatDate(selectedUser.lastLoginAt)
                          : "Nunca"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading}
            >
              {dialogType === "edit" ? "Cancelar" : "Fechar"}
            </Button>

            {dialogType === "edit" && (
              <Button
                onClick={handleEditSubmit}
                disabled={actionLoading || !editData.name.trim()}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{selectedUser?.name}</strong>? Esta ação não pode ser
              desfeita e todos os dados do usuário serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Usuário
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
