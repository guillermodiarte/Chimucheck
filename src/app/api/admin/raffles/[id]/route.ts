import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomInt } from "crypto";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

// GET /api/admin/raffles/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const raffle = await db.raffle.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { enteredAt: "asc" },
        include: {
          player: {
            select: {
              id: true,
              alias: true,
              name: true,
              email: true,
              image: true,
              registrationStatus: true,
              active: true,
            },
          },
        },
      },
    },
  });

  if (!raffle) {
    return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ raffle });
}

// POST /api/admin/raffles/[id]/draw is handled separately
