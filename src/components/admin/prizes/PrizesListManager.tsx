"use client";

import { useState } from "react";
import { Prize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import Image from "next/image";
import { createPrize, updatePrize, deletePrize } from "@/app/actions/prizes";

interface PrizesListManagerProps {
  initialPrizes: Prize[];
}

export default function PrizesListManager({ initialPrizes }: PrizesListManagerProps) {
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [isEditingPrize, setIsEditingPrize] = useState<Prize | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for Prize
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    images: "", // comma separated
    active: true,
    order: 0,
  });

  const handleEditPrize = (prize: Prize) => {
    setIsEditingPrize(prize);
    setFormData({
      title: prize.title,
      price: prize.price,
      description: prize.description,
      images: Array.isArray(prize.images)
        ? (prize.images as string[]).join(", ")
        : (typeof prize.images === 'string' ? prize.images : ""),
      active: prize.active,
      order: prize.order,
    });
    setIsDialogOpen(true);
  };

  const handleCreatePrize = () => {
    setIsEditingPrize(null);
    setFormData({
      title: "",
      price: "",
      description: "",
      images: "",
      active: true,
      order: 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitPrize = async () => {
    setIsLoading(true);
    const imagesArray = formData.images
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (isEditingPrize) {
      await updatePrize(isEditingPrize.id, {
        ...formData,
        images: imagesArray,
      });

      setPrizes((prev) =>
        prev.map((p) =>
          p.id === isEditingPrize.id
            ? { ...p, ...formData, images: imagesArray }
            : p
        )
      );
    } else {
      const res = await createPrize({
        ...formData,
        images: imagesArray,
      });
      if (res.success && res.prize) {
        setPrizes((prev) => [...prev, res.prize!]);
      }
    }
    setIsLoading(false);
    setIsDialogOpen(false);
  };

  const handleDeletePrize = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este premio?")) {
      await deletePrize(id);
      setPrizes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleActive = async (prize: Prize) => {
    const newActiveState = !prize.active;
    // Optimistic update
    setPrizes((prev) =>
      prev.map((p) => (p.id === prize.id ? { ...p, active: newActiveState } : p))
    );

    await updatePrize(prize.id, { active: newActiveState });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Lista de Premios</h2>
          <p className="text-gray-400 text-sm">Gestiona los premios disponibles y su visibilidad.</p>
        </div>
        <Button onClick={handleCreatePrize} className="bg-secondary text-black hover:bg-secondary/90 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Premio
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingPrize ? "Editar Premio" : "Crear Premio"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm text-gray-400">Título</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Precio (ej. 7 ChimuCoins)</label>
              <Input
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400">URLs de Imágenes (separadas por coma)</label>
              <Textarea
                value={formData.images}
                onChange={(e) =>
                  setFormData({ ...formData, images: e.target.value })
                }
                placeholder="/images/premio-1.jpg, /images/premio-2.jpg"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Usa URLs de imágenes subidas o externas.</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Orden</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="text-sm text-gray-400 mb-2">Visibilidad</label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-mode"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <label htmlFor="active-mode" className="text-white text-sm">
                  {formData.active ? "Visible para usuarios" : "Oculto (Borrador)"}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSubmitPrize} disabled={isLoading} className="bg-secondary text-black font-bold">
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border border-gray-800 bg-gray-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow className="border-gray-700 hover:bg-gray-800">
              <TableHead className="text-gray-400">Imagen</TableHead>
              <TableHead className="text-gray-400">Título</TableHead>
              <TableHead className="text-gray-400">Precio</TableHead>
              <TableHead className="text-gray-400">Orden</TableHead>
              <TableHead className="text-right text-gray-400">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.map((prize) => {
              // Parse images safely for display
              let displayImage = "";
              if (Array.isArray(prize.images) && prize.images.length > 0) {
                displayImage = (prize.images as string[])[0];
              } else if (typeof prize.images === 'string') {
                try {
                  const parsed = JSON.parse(prize.images);
                  if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
                  else displayImage = prize.images;
                } catch {
                  displayImage = prize.images || "";
                }
              }

              return (
                <TableRow key={prize.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell>
                    <div className="relative w-12 h-12 rounded overflow-hidden px-1">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={prize.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">{prize.title}</TableCell>
                  <TableCell className="text-gray-300">{prize.price}</TableCell>
                  <TableCell className="text-gray-300">{prize.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(prize)}
                        className="text-gray-400 hover:text-white"
                        title={prize.active ? "Desactivar" : "Activar"}
                      >
                        <Power className={`w-4 h-4 ${prize.active ? "text-green-500" : "text-gray-500"}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditPrize(prize)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeletePrize(prize.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {prizes.map((prize) => {
          // Parse images safely for display
          let displayImage = "";
          if (Array.isArray(prize.images) && prize.images.length > 0) {
            displayImage = (prize.images as string[])[0];
          } else if (typeof prize.images === 'string') {
            try {
              const parsed = JSON.parse(prize.images);
              if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
              else displayImage = prize.images;
            } catch {
              displayImage = prize.images || "";
            }
          }

          return (
            <div key={prize.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={prize.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <span className="text-xs">No img</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-white text-lg truncate">{prize.title}</h3>
                  <div className="text-secondary font-bold text-sm">
                    {prize.price}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Orden: {prize.order}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${prize.active
                        ? "bg-green-900/30 text-green-400 border border-green-900"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {prize.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-700/50 pt-3">
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(prize)} className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700">
                  <Power className={`w-4 h-4 mr-2 ${prize.active ? "text-green-500" : "text-gray-500"}`} />
                  {prize.active ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPrize(prize)}
                  className="bg-gray-800 border-gray-700 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePrize(prize.id)}
                  className="bg-gray-800 border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
