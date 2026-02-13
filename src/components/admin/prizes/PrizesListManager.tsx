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
import { Plus, Pencil, Power, X } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import Image from "next/image";
import { createPrize, updatePrize, deletePrize } from "@/app/actions/prizes";
import { LocalMultiImageUpload } from "@/components/admin/LocalMultiImageUpload";
import { toast } from "sonner";

interface PrizesListManagerProps {
  initialPrizes: Prize[];
}

export default function PrizesListManager({ initialPrizes }: PrizesListManagerProps) {
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [isEditingPrize, setIsEditingPrize] = useState<Prize | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Store pending files and their object URLs to map them back during upload
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());
  const [customFilename, setCustomFilename] = useState("");

  // Form State for Prize
  const [formData, setFormData] = useState<{
    title: string;
    price: string;
    description: string;
    images: string[];
    active: boolean;
    order: number;
  }>({
    title: "",
    price: "",
    description: "",
    images: [],
    active: true,
    order: 0,
  });

  const handleEditPrize = (prize: Prize) => {
    setIsEditingPrize(prize);
    setPendingFiles(new Map()); // Clear pending files on edit open
    setCustomFilename(""); // Reset custom filename

    let images: string[] = [];
    if (Array.isArray(prize.images)) {
      images = prize.images as string[];
    } else if (typeof prize.images === 'string') {
      try {
        const parsed = JSON.parse(prize.images);
        if (Array.isArray(parsed)) images = parsed;
        else if (prize.images) images = [prize.images];
      } catch {
        if (prize.images) images = [prize.images];
      }
    }

    setFormData({
      title: prize.title,
      price: prize.price,
      description: prize.description,
      images: images,
      active: prize.active,
      order: prize.order,
    });
    setIsDialogOpen(true);
  };

  const handleCreatePrize = () => {
    setIsEditingPrize(null);
    setPendingFiles(new Map()); // Clear pending files
    setCustomFilename(""); // Reset custom filename
    const maxOrder = prizes.reduce((max, prize) => (prize.order > max ? prize.order : max), 0);
    setFormData({
      title: "",
      price: "",
      description: "",
      images: [],
      active: true,
      order: maxOrder + 1,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitPrize = async () => {
    setIsLoading(true);

    // Process images: Upload pending files and replace blob URLs with real URLs
    let finalImages: string[] = [];
    const newImages = [...formData.images];
    let hasUploadErrors = false;

    // We process sequentially or parallel. Parallel is better.
    // We need to maintain the index/order.

    const uploadPromises = newImages.map(async (imgUrl, index) => {
      if (pendingFiles.has(imgUrl)) {
        const file = pendingFiles.get(imgUrl)!;
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        // Determine custom name
        let nameToSend;
        if (customFilename) {
          // If custom name provided: premio-customName-index
          // We use index+1 to be user friendly 1-based
          nameToSend = `premio-${customFilename}-${index + 1}`;
        } else {
          // If not provided: premio-originalName
          const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          nameToSend = `premio-${originalNameWithoutExt}`;
        }
        uploadFormData.append("customName", nameToSend);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          const data = await res.json();
          if (res.ok && data.success) {
            return data.url;
          } else {
            console.error("Failed to upload file:", data.message);
            return null; // or throw
          }
        } catch (e) {
          console.error("Upload error:", e);
          return null;
        }
      }
      return imgUrl; // Already a real URL
    });

    const results = await Promise.all(uploadPromises);

    // Check for failures
    if (results.some(r => r === null)) {
      toast.error("Algunas imágenes no se pudieron subir. Inténtalo de nuevo.");
      setIsLoading(false);
      return;
    }

    finalImages = results as string[];

    if (isEditingPrize) {
      await updatePrize(isEditingPrize.id, {
        ...formData,
        images: finalImages,
      });

      setPrizes((prev) =>
        prev.map((p) =>
          p.id === isEditingPrize.id
            ? { ...p, ...formData, images: finalImages }
            : p
        )
      );
    } else {
      const res = await createPrize({
        ...formData,
        images: finalImages,
      });
      if (res.success && res.prize) {
        setPrizes((prev) => [...prev, res.prize!]);
      }
    }

    // Cleanup blob URLs to avoid memory leaks (optional, browser handles it mostly)
    pendingFiles.forEach((_, url) => URL.revokeObjectURL(url));
    setPendingFiles(new Map());

    setIsLoading(false);
    setIsDialogOpen(false);
  };

  const handleToggleActive = async (prize: Prize) => {
    const newActiveState = !prize.active;
    // Optimistic update
    setPrizes((prev) =>
      prev.map((p) => (p.id === prize.id ? { ...p, active: newActiveState } : p))
    );

    await updatePrize(prize.id, { active: newActiveState });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const urlToRemove = formData.images[indexToRemove];

    // If it's a pending file, remove from map
    if (pendingFiles.has(urlToRemove)) {
      const newPending = new Map(pendingFiles);
      newPending.delete(urlToRemove);
      setPendingFiles(newPending);
      URL.revokeObjectURL(urlToRemove); // Good practice
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleAddFiles = (files: File[]) => {
    const newEntries: [string, File][] = [];
    const newUrls: string[] = [];

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newEntries.push([url, file]);
      newUrls.push(url);
    });

    setPendingFiles(prev => {
      const newMap = new Map(prev);
      newEntries.forEach(([url, file]) => newMap.set(url, file));
      return newMap;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newUrls]
    }));

    // Auto-fill custom filename if empty (take first file's name)
    if (!customFilename && files.length > 0) {
      const firstFile = files[0];
      const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, "");
      setCustomFilename(nameWithoutExt);
    }
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="md:col-span-2 space-y-3">
              <label className="text-sm text-gray-400">Imágenes del Premio</label>

              <div className="grid grid-cols-5 gap-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group aspect-square rounded overflow-hidden border border-gray-700">
                    <Image src={url} alt={`Imagen ${index}`} fill className="object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className="col-span-5 text-gray-500 text-sm italic py-2">
                    No hay imágenes seleccionadas.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <LocalMultiImageUpload
                  onFilesSelected={handleAddFiles}
                  onUrlSelected={(url) => {
                    setFormData(prev => ({
                      ...prev,
                      images: [...prev.images, url]
                    }));
                  }}
                  maxFiles={10}
                  currentCount={formData.images.length}
                />
                <p className="text-xs text-gray-500">Sube hasta 10 imágenes.</p>

                {/* Custom filename input (only if there are pending files) */}
                {Array.from(pendingFiles.keys()).length > 0 && (
                  <div className="mt-2 space-y-1 bg-gray-800/50 p-2 rounded border border-gray-700">
                    <label className="text-xs text-gray-400">Nombre base para archivos nuevos (opcional)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">premio-</span>
                      <Input
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        placeholder="nombre-base"
                        className="h-7 text-xs bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {customFilename
                        ? `Se guardarán como: premio-${customFilename}-1.ext, premio-${customFilename}-2.ext...`
                        : "Se usarán los nombres originales con prefijo 'premio-'"}
                    </p>
                  </div>
                )}
              </div>
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
                      <DeleteButton
                        id={prize.id}
                        deleteAction={deletePrize}
                        itemName="Premio"
                        onSuccess={() => setPrizes((prev) => prev.filter((p) => p.id !== prize.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      />
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
                <DeleteButton
                  id={prize.id}
                  deleteAction={deletePrize}
                  itemName="Premio"
                  onSuccess={() => setPrizes((prev) => prev.filter((p) => p.id !== prize.id))}
                  className="bg-gray-800 border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
