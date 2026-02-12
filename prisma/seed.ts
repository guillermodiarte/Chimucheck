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

  // Seed Prizes
  const initialPrizes = [
    {
      title: "Taza Chimucheck (Varias Skins)",
      price: "7 ChimuCoins",
      description: "Tu café o bebida energética nunca se vio tan bien.",
      images: [
        "/images/prizes/premio-1.jpg",
        "/images/prizes/premio-2.jpg",
        "/images/prizes/premio-3.jpg",
        "/images/prizes/premio-4.jpg"
      ],
      order: 1
    },
    {
      title: "Gorra Oficial",
      price: "7 ChimuCoins",
      description: "Lleva el estilo de ChimuCheck a donde vayas.",
      images: ["/images/prizes/premio-5.jpg"],
      order: 2
    },
    {
      title: "Remera Exclusiva",
      price: "15 ChimuCoins",
      description: "Vístete como un pro. Calidad premium y diseño único.",
      images: [
        "/images/prizes/premio-6.jpg",
        "/images/prizes/premio-7.jpg",
        "/images/prizes/premio-8.jpg",
        "/images/prizes/premio-9.jpg"
      ],
      order: 3
    },
    {
      title: "Almohadón Chimucheck",
      price: "20 ChimuCoins",
      description: "Comodidad máxima para esas largas sesiones de juego.",
      images: ["/images/prizes/premio-10.jpg"],
      order: 4
    },
    {
      title: "Caja Misteriosa",
      price: "25 ChimuCoins",
      description: "¿Te atreves? Un premio sorpresa de alto valor.",
      images: ["/images/prizes/premio-incognita.jpg"],
      order: 5
    }
  ];

  for (const prize of initialPrizes) {
    const existing = await prisma.prize.findFirst({ where: { title: prize.title } });
    if (!existing) {
      await prisma.prize.create({
        data: prize
      });
    }
  }
  console.log("Prizes seeded.");

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
