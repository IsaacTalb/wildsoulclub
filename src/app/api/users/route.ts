import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  console.log("API users route called");
  try {
    const user = await getAuthUser();
    console.log("Authenticated user:", user);
    if (!user) {
      console.error("Unauthorized: No user found");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { email, fullName, phone, imageUrl } = await req.json();
    console.log("User data to sync:", { email, fullName, phone, imageUrl });

    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        ...(fullName !== undefined && { full_name: fullName }),
        ...(phone !== undefined && { phone: phone }),
        ...(imageUrl !== undefined && { avatar_url: imageUrl }),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    console.log("User data inserted into Supabase:", data);

    // Admins are managed through the Supabase `admins` table instead of Clerk env lists.

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Failed to synchronize user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to synchronize user" },
      { status: 500 }
    );
  }
}