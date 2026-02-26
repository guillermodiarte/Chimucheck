import { db } from "@/lib/prisma";
import { StatsCard } from "@/components/admin/dashboard/StatsCard";
import { TopPlayersTable } from "@/components/admin/dashboard/TopPlayersTable";
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts";

async function getDashboardData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // KPI 1: Total Players
  const totalPlayers = await db.player.count();
  const playersPrevMonth = await db.player.count({
    where: { createdAt: { lt: thirtyDaysAgo } },
  });
  const playersChange = playersPrevMonth > 0
    ? (((totalPlayers - playersPrevMonth) / playersPrevMonth) * 100).toFixed(1)
    : "0";

  // KPI 2: Active Tournaments (not FINISHED/FINALIZADO)
  const activeTournaments = await db.tournament.count({
    where: {
      status: { notIn: ["FINISHED", "FINALIZADO"] },
      active: true,
    },
  });
  const totalTournaments = await db.tournament.count({ where: { active: true } });

  // KPI 3: New Registrations (this month)
  const newPlayersThisMonth = await db.player.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });
  const newPlayersPrevMonth = await db.player.count({
    where: {
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  });
  const registrationChange = newPlayersPrevMonth > 0
    ? (((newPlayersThisMonth - newPlayersPrevMonth) / newPlayersPrevMonth) * 100).toFixed(1)
    : "0";

  // KPI 4: Total ChimuCoins in circulation
  const chimucoinsResult = await db.player.aggregate({
    _sum: { chimucoins: true },
  });
  const totalChimucoins = chimucoinsResult._sum.chimucoins || 0;

  // Sparkline data (last 8 weeks of player registrations)
  const sparklineData: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = await db.player.count({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
    });
    sparklineData.push(count);
  }

  // KPI cards
  const kpiData = [
    {
      title: "Total Jugadores",
      value: totalPlayers.toLocaleString("es-AR"),
      change: `${Number(playersChange) >= 0 ? "+" : ""}${playersChange}%`,
      trend: (Number(playersChange) >= 0 ? "up" : "down") as "up" | "down",
      icon: "Users",
      sparkline: sparklineData,
    },
    {
      title: "Torneos Activos",
      value: activeTournaments.toString(),
      change: `${totalTournaments} total`,
      trend: "up" as "up" | "down",
      icon: "Calendar",
      sparkline: [0, 0, 0, 0, 0, 0, 0, activeTournaments],
    },
    {
      title: "Nuevos Registros (Mes)",
      value: newPlayersThisMonth.toString(),
      change: `${Number(registrationChange) >= 0 ? "+" : ""}${registrationChange}%`,
      trend: (Number(registrationChange) >= 0 ? "up" : "down") as "up" | "down",
      icon: "Newspaper",
      sparkline: sparklineData,
    },
    {
      title: "ChimuCoins Circulantes",
      value: totalChimucoins.toLocaleString("es-AR"),
      change: `${totalPlayers} jugadores`,
      trend: "up" as "up" | "down",
      icon: "DollarSign",
      sparkline: [0, 0, 0, 0, 0, 0, 0, totalChimucoins],
    },
  ];

  // Chart: Weekly registrations (last 12 weeks)
  const registrationData: { name: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = await db.player.count({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
    });
    registrationData.push({ name: `Sem ${12 - i}`, value: count });
  }

  // Chart: Prize distribution from PlayerStats
  const statsAgg = await db.playerStats.aggregate({
    _sum: {
      winsFirst: true,
      winsSecond: true,
      winsThird: true,
    },
  });
  const gold = statsAgg._sum.winsFirst || 0;
  const silver = statsAgg._sum.winsSecond || 0;
  const bronze = statsAgg._sum.winsThird || 0;
  const totalMedals = gold + silver + bronze;

  const prizeDistributionData = totalMedals > 0
    ? [
      { name: "Oro 🥇", value: gold, color: "#EAB308" },
      { name: "Plata 🥈", value: silver, color: "#9CA3AF" },
      { name: "Bronce 🥉", value: bronze, color: "#78350F" },
    ]
    : [
      { name: "Oro 🥇", value: 0, color: "#EAB308" },
      { name: "Plata 🥈", value: 0, color: "#9CA3AF" },
      { name: "Bronce 🥉", value: 0, color: "#78350F" },
    ];

  // Top players by chimucoins
  const topPlayers = await db.player.findMany({
    take: 5,
    orderBy: { chimucoins: "desc" },
    include: { stats: true },
    where: { active: true },
  });

  const topPlayersData = topPlayers.map((p, i) => ({
    rank: i + 1,
    name: p.alias || p.name || p.email,
    avatar: p.image || "",
    score: p.chimucoins.toLocaleString("es-AR"),
    medal: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "none",
  }));

  return { kpiData, registrationData, prizeDistributionData, topPlayersData, totalMedals };
}

export default async function DashboardPage() {
  const { kpiData, registrationData, prizeDistributionData, topPlayersData, totalMedals } =
    await getDashboardData();

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

      {/* Charts Row */}
      <DashboardCharts
        registrationData={registrationData}
        prizeDistributionData={prizeDistributionData}
        totalMedals={totalMedals}
      />

      {/* Bottom Section: Top Players */}
      <div className="grid gap-4">
        <TopPlayersTable data={topPlayersData} />
      </div>
    </div>
  );
}
