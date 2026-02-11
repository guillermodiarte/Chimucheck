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
import { Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { deleteNews } from "@/app/actions/news";

export default async function NewsPage() {
  const news = await db.news.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novedades</h1>
          <p className="text-gray-400">Gestiona las noticias y artículos del blog.</p>
        </div>
        <Link href="/admin/news/create">
          <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2">
            <Plus className="w-4 h-4" /> Nueva Noticia
          </Button>
        </Link>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Título</TableHead>
              <TableHead className="text-gray-300">Fecha</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-right text-gray-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-black">
            {news.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No hay noticias creadas.
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell className="font-medium text-white">{item.title}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${item.published
                          ? "bg-green-900/30 text-green-400 border border-green-900"
                          : "bg-yellow-900/30 text-yellow-400 border border-yellow-900"
                        }`}
                    >
                      {item.published ? "Publicada" : "Borrador"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <form action={deleteNews.bind(null, item.id)}>
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
