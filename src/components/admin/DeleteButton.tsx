"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { toast } from "sonner";

interface DeleteButtonProps {
  id: string;
  deleteAction: (id: string) => Promise<void | { success: boolean; error?: string }>;
  itemName?: string;
  className?: string;
  variant?: "ghost" | "outline" | "destructive";
  size?: "icon" | "sm" | "default";
  onSuccess?: () => void;
}

export function DeleteButton({
  id,
  deleteAction,
  itemName = "elemento",
  className,
  variant = "ghost",
  size = "icon",
  onSuccess,
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAction(id);

      // Handle cases where action returns an object with success/error (like prizes)
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        throw new Error(result.error);
      }

      toast.success(`${itemName} eliminado correctamente`);
      if (onSuccess) {
        onSuccess();
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent row clicks
          setIsOpen(true);
        }}
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
        {size !== "icon" && <span className="ml-2">Eliminar</span>}
      </Button>

      <DeleteConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title={`¿Eliminar ${itemName}?`}
        description={`Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este ${itemName.toLowerCase()}?`}
        isDeleting={isDeleting}
      />
    </>
  );
}
