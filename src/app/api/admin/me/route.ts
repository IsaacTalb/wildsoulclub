import { NextResponse } from "next/server";
import { getAuthUser, isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await isAdmin(user.id);

    if (!allowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to verify admin" }, { status: 500 });
  }
}
