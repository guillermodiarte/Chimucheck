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
