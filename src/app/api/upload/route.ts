import { NextResponse } from "next/server";
import { getSignedUploadUrl, getSignedReadUrl } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { folder, contentType } = body;

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

    const uploadUrl = await getSignedUploadUrl(folder, contentType);
    const objectKey = typeof uploadUrl === 'string' ? (uploadUrl as string).split("?")[0].split("/").pop() : '';

    return NextResponse.json({
      success: true,
      data: { uploadUrl, objectKey },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
