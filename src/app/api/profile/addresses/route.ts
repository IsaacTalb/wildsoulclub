import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(1).max(30),
  address: z.string().trim().min(1).max(500),
  township: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  zip: z.string().trim().max(20),
  isDefault: z.boolean(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from("delivery_addresses")
      .select("id, full_name, phone, address, township, city, state, zip, is_default, created_at")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Unable to load saved addresses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Complete all required address fields." }, { status: 400 });

    const input = parsed.data;
    const { count, error: countError } = await supabaseAdmin
      .from("delivery_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) throw countError;
    const makeDefault = input.isDefault || count === 0;
    if (makeDefault) {
      const { error } = await supabaseAdmin.from("delivery_addresses").update({ is_default: false }).eq("user_id", user.id);
      if (error) throw error;
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_addresses")
      .insert({
        user_id: user.id,
        full_name: input.fullName,
        phone: input.phone,
        address: input.address,
        township: input.township,
        city: input.city,
        state: input.state,
        zip: input.zip || null,
        is_default: makeDefault,
      })
      .select("id, full_name, phone, address, township, city, state, zip, is_default, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save this address." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const parsed = addressSchema.extend({ id: z.uuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Complete all required address fields." }, { status: 400 });
    const { id, fullName, phone, address, township, city, state, zip, isDefault } = parsed.data;
    if (isDefault) {
      const { error } = await supabaseAdmin.from("delivery_addresses").update({ is_default: false }).eq("user_id", user.id);
      if (error) throw error;
    }
    const { data, error } = await supabaseAdmin
      .from("delivery_addresses")
      .update({ full_name: fullName, phone, address, township, city, state, zip: zip || null, is_default: isDefault })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, full_name, phone, address, township, city, state, zip, is_default, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Unable to update this address." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
    const { data: removed, error } = await supabaseAdmin
      .from("delivery_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("is_default")
      .maybeSingle();
    if (error) throw error;
    if (removed?.is_default) {
      const { data: next } = await supabaseAdmin.from("delivery_addresses").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (next) await supabaseAdmin.from("delivery_addresses").update({ is_default: true }).eq("id", next.id).eq("user_id", user.id);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove this address." }, { status: 500 });
  }
}
