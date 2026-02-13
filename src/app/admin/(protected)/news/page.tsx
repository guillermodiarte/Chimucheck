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
import { Power, Plus, Edit } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import Link from "next/link";
import { deleteNews, toggleNewsStatus } from "@/app/actions/news";
import { SectionToggle } from "@/components/admin/SectionToggle";

export default async function NewsPage() {
  const news = await db.news.findMany({
    orderBy: { date: "desc" },
  });

  const section = await db.siteSection.findUnique({ where: { key: "news_section" } });
  const isEnabled = (section?.content as any)?.enabled ?? true;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novedades</h1>
          <p className="text-gray-400">Gestiona las noticias y artículos del blog.</p>
        </div>
        <div className="flex gap-3">
          <SectionToggle sectionKey="news_section" initialEnabled={isEnabled} label="Mostrar Secc." />
          <Link href="/admin/news/create">
            <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2">
              <Plus className="w-4 h-4" /> Nueva Noticia
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-900">
            <TableRow className="border-gray-800 hover:bg-gray-900">
              <TableHead className="text-gray-300">Imagen</TableHead>
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
              news.map((item: any) => (
                <TableRow key={item.id} className="border-gray-800 hover:bg-gray-900/50">
                  <TableCell>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-16 h-10 object-cover rounded border border-gray-800" />
                    ) : (
                      <div className="w-16 h-10 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                        Sin img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-white">{item.title}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${item.published
                        ? "bg-green-900/30 text-green-400 border border-green-900"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {item.published ? "Publicada" : "Borrador"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleNewsStatus.bind(null, item.id, item.published)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title={item.published ? "Desactivar" : "Activar"}>
                          <Power className={`w-4 h-4 ${item.published ? "text-green-500" : "text-gray-500"}`} />
                        </Button>
                      </form>
                      <Link href={`/admin/news/${item.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </Button>
                      </Link>
                      <DeleteButton
                        id={item.id}
                        deleteAction={deleteNews}
                        itemName="Noticia"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {news.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-800 rounded-lg">
            No hay noticias creadas.
          </div>
        ) : (
          news.map((item: any) => (
            <div key={item.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
              <div className="flex items-start gap-4">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded bg-gray-800 border-gray-700 flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-gray-800 rounded border-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                    Sin img
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span className="text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                    <span className="text-gray-600">•</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${item.published
                        ? "bg-green-900/30 text-green-400 border border-green-900"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                        }`}
                    >
                      {item.published ? "Publicada" : "Borrador"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-700/50 pt-3">
                <form action={toggleNewsStatus.bind(null, item.id, item.published)}>
                  <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700">
                    <Power className={`w-4 h-4 mr-2 ${item.published ? "text-green-500" : "text-gray-500"}`} />
                    {item.published ? "Desactivar" : "Activar"}
                  </Button>
                </form>
                <Link href={`/admin/news/${item.id}`}>
                  <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <DeleteButton
                  id={item.id}
                  deleteAction={deleteNews}
                  itemName="Noticia"
                  className="bg-gray-800 border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
