import { NextResponse } from "next/server";
import { readSpotBoard, readTinPolicy } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [board, policy] = await Promise.all([
    readSpotBoard(),
    readTinPolicy(),
  ]);
  return NextResponse.json({ ...board, policy });
}
