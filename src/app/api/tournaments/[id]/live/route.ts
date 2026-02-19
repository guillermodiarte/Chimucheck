import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a promise in Next.js 15
) {
  const resolvedParams = await params;
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: resolvedParams.id },
      include: {
        registrations: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Error fetching live tournament data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
