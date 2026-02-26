import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await db.notification.count({
    where: { read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await db.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
