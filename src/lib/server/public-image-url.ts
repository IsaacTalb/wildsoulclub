import "server-only";

export function publicImageUrl(
  imageUrl?: string | null,
  objectKey?: string | null,
) {
  const key = objectKey?.trim();
  if (key) {
    const normalizedKey = key.replace(/^\/+/, "");
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

    return publicBaseUrl
      ? `${publicBaseUrl}/${normalizedKey}`
      : `/api/public/images/${normalizedKey}`;
  }

  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) {
    return imageUrl;
  }

  const fallbackKey = imageUrl?.trim();
  return fallbackKey
    ? `/api/public/images/${fallbackKey.replace(/^\/+/, "")}`
    : null;
}
