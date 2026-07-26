import { NextResponse } from "next/server";
import { getPublicDropBySlug } from "@/lib/server/drops";

type DropContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: DropContext) {
  try {
    const { slug } = await params;
    const drop = await getPublicDropBySlug(slug);
    if (!drop) {
      return NextResponse.json({ success: false, error: "Drop not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: drop });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch drop" }, { status: 500 });
  }
}
