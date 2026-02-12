"use client";

import { useState } from "react";
import { Prize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import Image from "next/image";
import { createPrize, updatePrize, deletePrize, updatePrizesPageConfig } from "@/app/actions/prizes";

interface PrizesDashboardProps {
  initialPrizes: Prize[];
  initialConfig: any;
}

export default function PrizesDashboard({
  initialPrizes,
  initialConfig,
}: PrizesDashboardProps) {
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [config, setConfig] = useState(initialConfig);
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

  const handleSaveConfig = async () => {
    setIsLoading(true);
    await updatePrizesPageConfig(config);
    setIsLoading(false);
    alert("Configuración actualizada correctamente");
  };

  const handleEditPrize = (prize: Prize) => {
    setIsEditingPrize(prize);
    setFormData({
      title: prize.title,
      price: prize.price,
      description: prize.description,
      images: (prize.images as string[]).join(", "),
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
      // Optimistic update or refetch could go here, but we rely on server action revalidate + usage of initialPrizes prop if using router refresh. 
      // For simplicity in this client component, we will manually update local state or just reload.
      // Better UX: update local state.
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

  return (
    <div className="space-y-8">
      {/* SECTION CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* HEADER CONFIGURATION */}
        <Card className="bg-gray-900 border-gray-800 text-white h-fit">
          <CardHeader>
            <CardTitle>Portada Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Título Principal</label>
              <Input
                value={config.headerTitle || ""}
                onChange={(e) =>
                  setConfig({ ...config, headerTitle: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Subtítulo</label>
              <Input
                value={config.headerSubtitle || ""}
                onChange={(e) =>
                  setConfig({ ...config, headerSubtitle: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* INFO SECTION CONFIGURATION */}
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle>Sección Informativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Título</label>
              <Input
                value={config.infoTitle || ""}
                onChange={(e) =>
                  setConfig({ ...config, infoTitle: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Descripción</label>
              <Textarea
                value={config.infoDescription || ""}
                onChange={(e) =>
                  setConfig({ ...config, infoDescription: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Imagen Info (URL)</label>
              <Input
                value={config.infoImage || ""}
                onChange={(e) =>
                  setConfig({ ...config, infoImage: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Imagen Combo (URL)</label>
              <Input
                value={config.comboImage || ""}
                onChange={(e) =>
                  setConfig({ ...config, comboImage: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveConfig}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>

      {/* PRIZES LIST */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Lista de Premios</h2>
        <Button onClick={handleCreatePrize} className="bg-secondary text-black hover:bg-secondary/90">
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSubmitPrize} disabled={isLoading} className="bg-secondary text-black">
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-gray-800 bg-gray-900 overflow-hidden">
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
            {prizes.map((prize) => (
              <TableRow key={prize.id} className="border-gray-800 hover:bg-gray-800/50">
                <TableCell>
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    {(prize.images as string[]).length > 0 ? (
                      <Image
                        src={(prize.images as string[])[0]}
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
