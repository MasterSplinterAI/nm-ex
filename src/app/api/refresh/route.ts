import { NextResponse } from "next/server";
import { refreshSpotBoard } from "@/lib/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.REFRESH_SECRET;
  if (secret) {
    const header = request.headers.get("x-refresh-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const board = await refreshSpotBoard();
  return NextResponse.json({ ok: true, board });
}
