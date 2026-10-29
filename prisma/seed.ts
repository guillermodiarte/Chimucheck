import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const initialBanners = [
  {
    title: "BIENVENIDO A CHIMUCHECK",
    subtitle: "El Universo Gaming Definitivo",
    imageUrl: "/videos/carousel-1.mp4",
    active: true,
    order: 1
  },
  {
    title: "PARTICIPA Y GANA",
    subtitle: "Torneos Semanales",
    imageUrl: "/images/slide/slide-2.jpg",
    active: true,
    order: 2
  },
  {
    title: "VISITA NUESTRA TIENDA",
    subtitle: "Canjea tus ChimuCoins",
    imageUrl: "/images/slide/slide-3.jpg",
    active: true,
    order: 3
  },
  {
    title: "SE PARTE DE LA COMUNIDAD",
    subtitle: "Discord & Redes Sociales",
    imageUrl: "/images/slide/slide-4.jpg",
    active: true,
    order: 4
  }
]

const initialNews = [
  {
    title: "¡Nuevas Recompensas!",
    slug: "nuevas-recompensas",
    content: "Canjea tus ChimuCoins por gorras, tazas y remeras exclusivas. ¡Juega y gana!",
    imageUrl: "/images/news-1.jpg",
    published: true,
    date: new Date("2026-02-10")
  },
  {
    title: "Estamos en Twitch",
    slug: "estamos-en-twitch",
    content: "No te pierdas los streams diarios. Sorteos, risas y mucho más.",
    imageUrl: "/images/news-2.jpg",
    published: true,
    date: new Date("2026-02-08")
  },
  {
    title: "Torneo de Gaming",
    slug: "torneo-de-gaming",
    content: "Inscríbete en el próximo torneo de CS2 y Valorant. Premios en efectivo.",
    imageUrl: "/images/news-3.jpg",
    published: true,
    date: new Date("2026-02-05")
  }
]

const initialEvents = [
  {
    name: "Torneo CS2 - Qualifiers",
    description: "Rondas clasificatorias para el torneo mayor.",
    date: new Date("2026-03-15T18:00:00"),
    location: "Online / Faceit",
    imageUrl: "/images/chimucoin/game-1.jpg"
  },
  {
    name: "Meet & Greet Córdoba",
    description: "Reunión con la comunidad y entrega de premios.",
    date: new Date("2026-04-20T14:00:00"),
    location: "Córdoba Capital",
    imageUrl: "/images/about/dario.jpg"
  }
]

const initialAboutData = {
  title: "Dario Ruiz",
  bio: "Apasionado por los videojuegos y la creación de contenido. Fundé ChimuCheck para conectar a gamers de todo el mundo y premiar su pasión.",
  instagram: "chimucheck"
}

async function main() {
  console.log('Start seeding...')

  // Seed Admin User
  const password = await hash('admin123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@chimucheck.com' },
    update: {},
    create: {
      email: 'admin@chimucheck.com',
      name: 'Admin',
      password, // Hashed password
      role: 'ADMIN'
    }
  })
  console.log({ user })

  // Seed Banners
  const bannerCount = await prisma.banner.count()
  if (bannerCount === 0) {
    for (const banner of initialBanners) {
      await prisma.banner.create({ data: banner })
    }
    console.log('Banners seeded.')
  }

  // Seed News
  const newsCount = await prisma.news.count()
  if (newsCount === 0) {
    for (const item of initialNews) {
      await prisma.news.create({ data: item })
    }
    console.log('News seeded.')
  }

  // Seed Events
  const eventsCount = await prisma.event.count()
  if (eventsCount === 0) {
    for (const item of initialEvents) {
      await prisma.event.create({ data: item })
    }
    console.log('Events seeded.')
  }

  // Seed About Section
  const aboutSection = await prisma.siteSection.findUnique({ where: { key: "about_us" } })
  if (!aboutSection) {
    await prisma.siteSection.create({
      data: {
        key: "about_us",
        content: initialAboutData
      }
    })
    console.log('About section seeded.')
  }

  // Clean up legacy mock prizes with broken image paths if they exist
  const legacyBrokenTitles = [
    "Taza Chimucheck (Varias Skins)",
    "Gorra Oficial",
    "Remera Exclusiva",
    "Caja Misteriosa",
  ];
  const legacyPrizes = await prisma.prize.findMany({
    where: { title: { in: legacyBrokenTitles } }
  });
  for (const p of legacyPrizes) {
    let imgs: any[] = [];
    try {
      imgs = Array.isArray(p.images) ? (p.images as any[]) : JSON.parse((p.images as string) || "[]");
    } catch {
      imgs = [];
    }
    if (imgs.some((img) => typeof img === "string" && img.includes("/images/prizes/"))) {
      await prisma.prize.delete({ where: { id: p.id } });
      console.log(`Premios obsoletos eliminados: ${p.title}`);
    }
  }

  // Seed Prizes Page Section
  await prisma.siteSection.upsert({
    where: { key: "prizes_section" },
    update: {},
    create: {
      key: "prizes_section",
      content: {
        headerTitle: "PREMIOS EXCLUSIVOS",
        headerSubtitle: "Tu esfuerzo tiene recompensa. Canjea tus ChimuCoins por el mejor equipamiento.",
        infoTitle: "ACUMULA. GANA. RECLAMA.",
        infoDescription: "Cada torneo, cada victoria y cada participación te otorga ChimuCoins. Úsalas sabiamente para desbloquear premios físicos reales. No es solo un juego, es tu recompensa por ser el mejor.",
        infoImage: "/images/prizes/premio-info-v2.jpg",
        comboImage: "/images/prizes/premio-combo.jpg",
        steps: [
          { title: "Paso 1", description: "Juega Torneos" },
          { title: "Paso 2", description: "Gana ChimuCoins" },
          { title: "Paso 3", description: "Elige tu Premio" },
          { title: "Paso 4", description: "Canjealos en el Torneo" }
        ]
      }
    }
  });
  console.log("Prizes section seeded.");

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
