import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { email, fullName, phone, imageUrl } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        clerk_id: user.id,
        email: email || user.emailAddresses?.[0]?.emailAddress,
        full_name: fullName || user.fullName,
        phone: phone || user.phoneNumbers?.[0]?.phoneNumber,
        avatar_url: imageUrl || user.imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to synchronize user" },
      { status: 500 }
    );
  }
}