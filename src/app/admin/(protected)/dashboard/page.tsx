import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/prisma";
import { Newspaper, Calendar, Image as ImageIcon } from "lucide-react";

async function getStats() {
  const newsCount = await db.news.count();
  const eventsCount = await db.event.count();
  const bannersCount = await db.banner.count();
  return { newsCount, eventsCount, bannersCount };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-400">Resumen general del sitio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banners Activos</CardTitle>
            <ImageIcon className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bannersCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novedades</CardTitle>
            <Newspaper className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newsCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
