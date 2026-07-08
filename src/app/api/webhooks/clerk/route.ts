import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const payload = await req.text();
  const headersList = headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { success: false, error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const eventType = evt.type;
  const user = evt.data;

  if (eventType === "user.created" || eventType === "user.updated") {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email_addresses?.[0]?.email_address,
          fullName: `${user.first_name} ${user.last_name}`,
          phone: user.phone_numbers?.[0]?.phone_number,
          imageUrl: user.image_url,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to synchronize user");
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Failed to synchronize user" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}