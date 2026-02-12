"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createUser, updateUser, deleteUser, toggleUserStatus } from "@/app/actions/users";
import { toast } from "sonner";
import { ChevronDown, FileJson, Download, Upload } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  active?: boolean;
}

export default function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await createUser(null, formData);
    if (!result?.success) {
      toast.error(result?.message || "Error al crear usuario");
    } else {
      toast.success("Usuario creado correctamente");
      setIsCreateOpen(false);
      window.location.reload();
    }
  }

  async function handleUpdate(formData: FormData) {
    const result = await updateUser(null, formData);
    if (!result?.success) {
      toast.error(result?.message || "Error al actualizar usuario");
    } else {
      toast.success("Usuario actualizado correctamente");
      setEditingUser(null);
      window.location.reload();
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      await deleteUser(id);
      toast.success("Usuario eliminado");
      setUsers(users.filter(u => u.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Administradores</h2>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700">
                <FileJson className="w-4 h-4 mr-2" />
                Exportar/Importar
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
              <DropdownMenuItem
                className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                onClick={async () => {
                  const { exportUsers } = await import("@/app/actions/users-backup");
                  const res = await exportUsers();
                  if (res.success && res.data) {
                    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `users_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Copia de seguridad descargada");
                  } else {
                    toast.error("Error al exportar");
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2 text-blue-400" />
                Exportar Usuarios (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                onClick={() => document.getElementById("import-users-input")?.click()}
              >
                <Upload className="w-4 h-4 mr-2 text-green-400" />
                Importar Usuarios (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden Input for Import */}
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="import-users-input"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (!confirm("⚠️ ATENCIÓN: Esta acción actualizará los usuarios existentes si coinciden los emails. ¿Deseas continuar?")) {
                e.target.value = "";
                return;
              }

              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const json = JSON.parse(event.target?.result as string);
                  const { importUsers } = await import("@/app/actions/users-backup");
                  const res = await importUsers(json);

                  if (res.success) {
                    toast.success(res.message);
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    toast.error(res.message);
                  }
                } catch (error) {
                  toast.error("Error al leer el archivo JSON");
                }
              };
              reader.readAsText(file);
              e.target.value = ""; // Reset input
            }}
          />

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black hover:bg-yellow-400">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Administrador</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <PasswordInput id="password" name="password" required className="bg-gray-800 border-gray-700" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary text-black hover:bg-yellow-400">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-black/40 border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-400">Nombre</TableHead>
              <TableHead className="text-gray-400">Email</TableHead>
              <TableHead className="text-gray-400">Rol</TableHead>
              <TableHead className="text-right text-gray-400">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">{user.name}</TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.active !== false
                    ? "bg-green-900/30 text-green-400 border border-green-900"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    {user.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <form action={() => toggleUserStatus(user.id, user.active !== false)}>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={user.active !== false ? "Desactivar" : "Activar"}>
                        <Power className={`w-4 h-4 ${user.active !== false ? "text-green-500" : "text-gray-500"}`} />
                      </Button>
                    </form>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-lg">{user.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20">
                  {user.role}
                </span>
              </div>

              <div className="text-sm text-gray-400 break-all">
                {user.email}
              </div>

              <div className="pt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.active !== false
                  ? "bg-green-900/30 text-green-400 border border-green-900"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
                  }`}
                >
                  {user.active !== false ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-700/50 pt-3">
              <form action={() => toggleUserStatus(user.id, user.active !== false)}>
                <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700">
                  <Power className={`w-4 h-4 mr-2 ${user.active !== false ? "text-green-500" : "text-gray-500"}`} />
                  {user.active !== false ? "Desactivar" : "Activar"}
                </Button>
              </form>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                onClick={() => setEditingUser(user)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => handleDelete(user.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form action={handleUpdate} className="space-y-4 py-4">
              <input type="hidden" name="id" value={editingUser.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingUser.name || ""}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nueva Contraseña (Opcional)</Label>
                <PasswordInput
                  id="edit-password"
                  name="password"
                  className="bg-gray-800 border-gray-700"
                  placeholder="Dejar vacía para mantener la actual"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary text-black hover:bg-yellow-400">Actualizar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
