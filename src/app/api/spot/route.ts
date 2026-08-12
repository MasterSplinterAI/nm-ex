import { NextResponse } from "next/server";
import { readSpotBoard } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const board = await readSpotBoard();
  return NextResponse.json(board);
}
