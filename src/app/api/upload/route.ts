import { NextResponse } from "next/server";
import { getSignedUploadUrl } from "@/lib/upload";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { folder, contentType, fileName } = body;

    if (!folder || !contentType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: folder, contentType" },
        { status: 400 }
      );
    }

    const validFolders = ["products", "payments", "avatars", "hero", "collections", "banners", "blogs", "temp", "invoices", "new-drops", "archive-sales"];
    if (!validFolders.includes(folder)) {
      return NextResponse.json(
        { success: false, error: "Invalid folder" },
        { status: 400 }
      );
    }

    const { url, objectKey } = await getSignedUploadUrl(folder, contentType, fileName);
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";

    return NextResponse.json({
      success: true,
      data: { uploadUrl: url, objectKey, imageUrl: publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : objectKey },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate upload URL";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: message === "Unauthorized" || message.includes("Forbidden") ? message : "Failed to generate upload URL" },
      { status }
    );
  }
}
