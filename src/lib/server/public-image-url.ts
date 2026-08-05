import "server-only";

export function publicImageUrl(
  imageUrl?: string | null,
  objectKey?: string | null,
) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) {
    return imageUrl;
  }

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBaseUrl && objectKey) {
    return `${publicBaseUrl}/${objectKey.replace(/^\/+/, "")}`;
  }

  const key = objectKey || imageUrl;
  return key ? `/api/public/images/${key.replace(/^\/+/, "")}` : null;
}
