import { NextResponse } from "next/server";
import { getSignedUploadUrl } from "@/lib/upload";

export async function POST(req: Request) {
  try {
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
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
