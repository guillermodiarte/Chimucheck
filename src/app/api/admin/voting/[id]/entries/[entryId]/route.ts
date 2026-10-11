import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

type Params = { params: Promise<{ id: string; entryId: string }> };

// DELETE /api/admin/voting/[id]/entries/[entryId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { entryId } = await params;

  await db.votingEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ success: true });
}

// PUT /api/admin/voting/[id]/entries/[entryId] – update entry metadata
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await verifyAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { entryId } = await params;
  const body = await req.json();
  const { instagramAccount, authorName } = body;

  const entry = await db.votingEntry.update({
    where: { id: entryId },
    data: {
      ...(instagramAccount !== undefined && { instagramAccount }),
      ...(authorName !== undefined && { authorName }),
    },
  });

  return NextResponse.json({ entry });
}
