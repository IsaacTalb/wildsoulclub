import { NextResponse } from "next/server";
import { getSignedUploadUrl, PUBLIC_IMAGE_CACHE_CONTROL } from "@/lib/upload";
import { requireAdmin } from "@/lib/auth";
import { getR2PublicUrl } from "@/lib/server/public-image-url";
import { authorizeOrderAccess } from "@/lib/server/order-access";

const PAYMENT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_PAYMENT_IMAGE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { folder, contentType, fileName, fileSize, order_id, guest_access_token } = body;

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

    if (folder === "payments") {
      if (!order_id || !Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_PAYMENT_IMAGE_SIZE || !PAYMENT_IMAGE_TYPES.has(contentType)) {
        return NextResponse.json({ success: false, error: "Payment uploads require an order and an image no larger than 10 MB" }, { status: 400 });
      }
      const order = await authorizeOrderAccess(order_id, guest_access_token);
      if (!order) throw new Error("Unauthorized");
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as Record<string, string>)[contentType];
      const { url, objectKey } = await getSignedUploadUrl(folder, contentType, `proof.${extension}`, {
        contentLength: fileSize,
        objectKeyPrefix: `payments/${order.id}`,
      });
      return NextResponse.json({ success: true, data: { uploadUrl: url, uploadHeaders: { "Content-Type": contentType }, objectKey, imageUrl: getR2PublicUrl(objectKey) } });
    } else {
      await requireAdmin();
    }

    const { url, objectKey } = await getSignedUploadUrl(folder, contentType, fileName);
    const isPublicImage = !["payments", "avatars", "blogs", "temp", "invoices"].includes(folder);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: url,
        uploadHeaders: {
          "Content-Type": contentType,
          ...(isPublicImage ? { "Cache-Control": PUBLIC_IMAGE_CACHE_CONTROL } : {}),
        },
        objectKey,
        imageUrl: getR2PublicUrl(objectKey),
      },
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
