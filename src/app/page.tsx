import HeroCarousel from "@/components/HeroCarousel";
import GamingSection from "@/components/GamingSection";

import ChimuCoinSection from "@/components/ChimuCoinSection";

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
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 3,
  });
}

export default async function Home() {
  const data = await getData(); // Still needed for static texts like hero subtitle
  const banners = await getBanners();
  const news = await getNews();
  const events = await getEvents();

  return (
    <div className="bg-black text-white">
      {/* Hero Carousel */}
      <HeroCarousel slides={banners} />

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
      <GamingSection />

      {/* ChimuCoin Section */}
      <ChimuCoinSection />





      {/* News Section */}
      <section id="news" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
          <span className="text-primary">Últimas</span> Novedades
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all hover:transform hover:-translate-y-2 group"
            >
              <div className="aspect-video relative overflow-hidden">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
              </div>
              <div className="p-6">
                <div className="text-secondary text-sm font-bold mb-2">{new Date(item.date).toLocaleDateString()}</div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section id="events" className="py-24 px-4 max-w-7xl mx-auto bg-gray-900/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
            Próximos <span className="text-secondary">Eventos</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col md:flex-row bg-black rounded-xl border border-gray-800 overflow-hidden hover:border-secondary/50 transition-colors">
                <div className="w-full md:w-1/3 relative h-48 md:h-auto">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">Sin Imagen</div>
                  )}
                </div>
                <div className="p-6 flex flex-col justify-center flex-1">
                  <div className="text-secondary font-bold mb-1 uppercase tracking-wider text-sm">
                    {new Date(event.date).toLocaleString()}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">{event.name}</h3>
                  <p className="text-gray-400 mb-4">{event.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    📍 {event.location || "Online"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div >
  );
}
