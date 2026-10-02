import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

// GET /api/admin/raffles
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const raffles = await db.raffle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json({ raffles });
}
