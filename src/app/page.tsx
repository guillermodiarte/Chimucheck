import HeroCarousel from "@/components/HeroCarousel";
import StreamingSection from "@/components/StreamingSection";
import GamingSection from "@/components/GamingSection";
import EventsGrid from "@/components/EventsGrid";
import NewsGrid from "@/components/NewsGrid";

import ChimuCoinSectionWrapper from "@/components/ChimuCoinSectionWrapper";

import Image from "next/image";
import contentData from "@/data/content.json";

async function getData() {
  return contentData;
}

import { db } from "@/lib/prisma";
import { Banner, News, Event } from "@prisma/client";

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
    take: 3,
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
  const data = await getData(); // Still needed for static texts like hero subtitle
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

  return (
    <div className="bg-black text-white">
      {/* Hero Carousel */}
      <HeroCarousel slides={banners} />

      {/* Streaming Section */}
      <StreamingSection config={streamingContent} />

      {/* Intro / Bio Section */}
      <section className="py-20 px-4 text-center bg-black relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {data.hero.subtitle}
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            {data.hero.description}
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
