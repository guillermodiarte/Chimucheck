import { db } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Power } from "lucide-react";
import Link from "next/link";
import { deleteBanner, toggleBannerStatus } from "@/app/actions/banners";

export default async function BannersPage() {
  const banners = await db.banner.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-gray-400">Gestiona las imágenes del carrusel principal.</p>
        </div>
        <Link href="/admin/banners/create">
          <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2">
            <Plus className="w-4 h-4" /> Nuevo Banner
          </Button>
        </Link>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Imagen</TableHead>
              <TableHead className="text-gray-300">Título</TableHead>
              <TableHead className="text-gray-300">Orden</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black">
            {banners.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No hay banners creados.
                </TableCell>
              </TableRow>
            ) : (
              banners.map((item) => (
                <TableRow key={item.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell>
                    <img src={item.imageUrl} alt={item.title} className="w-16 h-10 object-cover rounded" />
                  </TableCell>
                  <TableCell className="font-medium text-white">{item.title}</TableCell>
                  <TableCell className="text-white">{item.order}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${item.active
                          ? "bg-green-900/30 text-green-400 border border-green-900"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleBannerStatus.bind(null, item.id, item.active)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={item.active ? "Desactivar" : "Activar"}>
                          <Power className={`w-4 h-4 ${item.active ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>
                      <form action={deleteBanner.bind(null, item.id)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
