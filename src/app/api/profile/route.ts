import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80),
  phone: z.string().trim().max(30),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter valid profile information." }, { status: 400 });
    }

    const { firstName, lastName, phone } = parsed.data;
    const fullName = `${firstName} ${lastName}`.trim();
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .select("id, email, full_name, phone")
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
