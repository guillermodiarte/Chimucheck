import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

// GET /api/admin/voting – list all contests
export async function GET() {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const contests = await db.votingContest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
      entries: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  return NextResponse.json({ contests });
}

// POST /api/admin/voting – create a new contest
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, status } = body;

  if (!title || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Título, fecha de inicio y fin son requeridos" },
      { status: 400 }
    );
  }

  const contest = await db.votingContest.create({
    data: {
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "DRAFT",
    },
  });

  return NextResponse.json({ contest }, { status: 201 });
}
