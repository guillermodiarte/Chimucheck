import HeroCarousel from "@/components/HeroCarousel";
import StreamingSection from "@/components/StreamingSection";
import GamingSection from "@/components/GamingSection";
import EventsGrid from "@/components/EventsGrid";
import NewsGrid from "@/components/NewsGrid";

import ChimuCoinSectionWrapper from "@/components/ChimuCoinSectionWrapper";


import { db } from "@/lib/prisma";
import { Banner, News, Event } from "@prisma/client";

import { TopPlayerItem } from "@/components/TopPlayersBannerSlide";

export const dynamic = "force-dynamic";

async function getBanners(): Promise<Banner[]> {
  return await db.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
}

async function getNews(): Promise<News[]> {
  return await db.news.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });
}

async function getEvents(): Promise<Event[]> {
  return await db.event.findMany({
    where: { active: true },
    orderBy: { date: "asc" },
    take: 3,
  });
}

export default async function Home() {
  const banners = await getBanners();

  const newsSection = await db.siteSection.findUnique({ where: { key: "news_section" } });
  const showNews = (newsSection?.content as any)?.enabled ?? true;

  const eventsSection = await db.siteSection.findUnique({ where: { key: "events_section" } });
  const showEvents = (eventsSection?.content as any)?.enabled ?? true;

  const news = showNews ? await getNews() : [];
  const events = showEvents ? await getEvents() : [];

  const gamingSection = await db.siteSection.findUnique({ where: { key: "gaming_section" } });
  const gamingContent = (gamingSection?.content as any) || null;

  const streamingSection = await db.siteSection.findUnique({ where: { key: "streaming_section" } });
  const streamingContent = (streamingSection?.content as any) || null;

  const topPlayersSection = await db.siteSection.findUnique({ where: { key: "banner_top_players" } });
  const topContent = (topPlayersSection?.content as any) || {};
  const showTopPlayers = topContent.enabled ?? true;
  const topPlayersOrder = typeof topContent.order === "number" ? topContent.order : 2;

  const bannerSettingsSection = await db.siteSection.findUnique({ where: { key: "banner_settings" } });
  const bannerSettings = (bannerSettingsSection?.content as any) || {};
  const bannerInterval = typeof bannerSettings.interval === "number" ? bannerSettings.interval : 5;

  let topPlayersData: TopPlayerItem[] = [];
  if (showTopPlayers) {
    const topPlayers = await db.player.findMany({
      take: 5,
      orderBy: { chimucoins: "desc" },
      include: { stats: true },
      where: { active: true },
    });

    topPlayersData = topPlayers.map((p, i) => ({
      id: p.id,
      rank: i + 1,
      name: p.alias || p.name || p.email,
      alias: p.alias,
      avatar: p.image || null,
      score: p.chimucoins,
      formattedScore: p.chimucoins.toLocaleString("es-AR"),
      medal: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "none",
      winsFirst: p.stats?.winsFirst ?? 0,
    }));
  }

  return (
    <div className="bg-black text-white">
      {/* Hero Carousel */}
      <HeroCarousel
        slides={banners}
        topPlayers={topPlayersData}
        showTopPlayers={showTopPlayers}
        topPlayersOrder={topPlayersOrder}
        interval={bannerInterval}
      />

      {/* Streaming Section */}
      <StreamingSection config={streamingContent} />

      {/* Intro / Bio Section */}
      <section className="py-20 px-4 text-center bg-black relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Pasatiempo | Gaming | Diversión
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Tu destino para lo mejor del gaming, streams y entretenimiento.
          </p>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            ¡Sumate a la comunidad!
          </p>
        </div>
      </section>

      {/* Gaming Section */}
      <GamingSection content={gamingContent} />

      {/* ChimuCoin Section */}
      <ChimuCoinSectionWrapper />





      {/* News Section */}
      {showNews && (
        <section id="news" className="py-24 px-4 max-w-[1400px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
            <span className="text-primary">Últimas</span> Novedades
          </h2>

          <NewsGrid news={news} />
        </section>
      )}

      {/* Events Section */}
      {showEvents && events.length > 0 && (
        <section id="events" className="py-24 px-4 max-w-[1400px] mx-auto bg-gray-900/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
            Próximos <span className="text-secondary">Eventos</span>
          </h2>

          <EventsGrid events={events} />
        </section>
      )}
    </div >
  );
}
