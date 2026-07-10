import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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
        clerk_id: user.id,
        email: email || user.emailAddresses?.[0]?.emailAddress,
        full_name: fullName || user.fullName,
        phone: phone || user.phoneNumbers?.[0]?.phoneNumber,
        avatar_url: imageUrl || user.imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    console.log("User data inserted into Supabase:", data);

    // Check if the user is an admin and update the admins table
    const adminIds = (process.env.CLERK_ADMIN_USER_IDS || "").split(",");
    if (adminIds.includes(user.id)) {
      console.log("User is an admin, assigning admin role...");
      const { error: adminError } = await supabaseAdmin
        .from("admins")
        .upsert({
          user_id: user.id,
          role: "admin",
        });

      if (adminError) {
        console.error("Failed to assign admin role:", adminError);
      } else {
        console.log("Admin role assigned successfully");
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Failed to synchronize user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to synchronize user" },
      { status: 500 }
    );
  }
}