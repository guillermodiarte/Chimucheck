import HeroCarousel from "@/components/HeroCarousel";
import GamingSection from "@/components/GamingSection";

import ChimuCoinSection from "@/components/ChimuCoinSection";

import Image from "next/image";
import contentData from "@/data/content.json";

async function getData() {
  return contentData;
}

export default async function Home() {
  const data = await getData();

  return (
    <div className="bg-black text-white">
      {/* Hero Carousel */}
      <HeroCarousel />

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
          {data.news.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all hover:transform hover:-translate-y-2 group"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="text-secondary text-sm font-bold mb-2">{item.date}</div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
