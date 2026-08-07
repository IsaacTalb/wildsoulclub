import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, PUBLIC_IMAGE_CACHE_CONTROL, r2Client } from "@/lib/upload";

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
    const object = await r2Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    if (!object.Body) throw new Error("Empty image object");

    // Stream the object instead of redirecting to a one-hour signed URL. A
    // cached redirect can outlive its signature and was the source of
    // intermittent broken images for anonymous visitors when no public R2
    // hostname was configured.
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Cache-Control": object.CacheControl || PUBLIC_IMAGE_CACHE_CONTROL,
        "Content-Type": object.ContentType || "application/octet-stream",
        ...(object.ContentLength !== undefined
          ? { "Content-Length": String(object.ContentLength) }
          : {}),
        ...(object.ETag ? { ETag: object.ETag } : {}),
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
  }
}
