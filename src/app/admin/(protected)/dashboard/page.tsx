import { db } from "@/lib/prisma";
import { kpiData, topPlayersData } from "@/components/admin/dashboard/mockData";
import { StatsCard } from "@/components/admin/dashboard/StatsCard";
import { TopPlayersTable } from "@/components/admin/dashboard/TopPlayersTable";
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts";

async function getStats() {
  // Keeping real stats for later integration, or hybrid approach
  const newsCount = await db.news.count();
  const eventsCount = await db.event.count();
  const bannersCount = await db.banner.count();
  return { newsCount, eventsCount, bannersCount };
}

export default async function DashboardPage() {
  // const stats = await getStats(); // Unused for now in mock mode

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-gray-400">Vista general y métricas de rendimiento.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <StatsCard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Row - Client Side Wrapper */}
      <DashboardCharts />

      {/* Bottom Section: Top Players */}
      <div className="grid gap-4">
        <TopPlayersTable data={topPlayersData} />
      </div>
    </div>
  );
}
