"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createUser, updateUser, deleteUser } from "@/app/actions/users";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Administradores</h2>
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
                <Input id="password" name="password" type="password" required className="bg-gray-800 border-gray-700" />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary text-black hover:bg-yellow-400">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
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
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
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
