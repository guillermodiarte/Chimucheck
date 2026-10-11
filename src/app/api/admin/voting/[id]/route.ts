import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/voting/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const contest = await db.votingContest.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { votes: true } },
        },
      },
      _count: { select: { entries: true } },
    },
  });

  if (!contest)
    return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

  return NextResponse.json({ contest });
}

// PUT /api/admin/voting/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, startDate, endDate, status } = body;

  const contest = await db.votingContest.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(status && { status }),
    },
  });

  return NextResponse.json({ contest });
}

// DELETE /api/admin/voting/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await db.votingContest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
