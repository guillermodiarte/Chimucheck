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

// POST /api/admin/voting/[id]/entries – add an image entry to a contest
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { imageUrl, instagramAccount, authorName } = body;

  if (!imageUrl) {
    return NextResponse.json({ error: "La imagen es requerida" }, { status: 400 });
  }

  // Check contest exists
  const contest = await db.votingContest.findUnique({ where: { id } });
  if (!contest)
    return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

  const entry = await db.votingEntry.create({
    data: {
      contestId: id,
      imageUrl,
      instagramAccount: instagramAccount || null,
      authorName: authorName || null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
