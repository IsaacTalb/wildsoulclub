import { NextResponse } from "next/server";
import { getPublicDrops } from "@/lib/server/drops";

export async function GET() {
  try {
    const drops = await getPublicDrops();
    return NextResponse.json({ success: true, data: drops });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch drops" }, { status: 500 });
  }
}
