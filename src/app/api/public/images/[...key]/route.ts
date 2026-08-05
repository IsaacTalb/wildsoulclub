import { NextResponse } from "next/server";
import { getSignedReadUrl } from "@/lib/upload";

const PUBLIC_IMAGE_FOLDERS = new Set([
  "products",
  "hero",
  "collections",
  "banners",
  "new-drops",
  "archive-sales",
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");
  const [folder] = key;

  if (!folder || !PUBLIC_IMAGE_FOLDERS.has(folder) || objectKey.includes("..")) {
    return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
  }

  try {
    const signedUrl = await getSignedReadUrl(objectKey);
    return NextResponse.redirect(signedUrl, 307);
  } catch {
    return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
  }
}
