import "server-only";

export const LEGACY_R2_PUBLIC_ORIGIN =
  "https://pub-6bca4d6cbfb74e02a6db47ee742f7a5f.r2.dev";

function r2PublicBaseUrl() {
  const value = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("R2_PUBLIC_BASE_URL is not configured");
  return value;
}

export function getR2PublicUrl(objectKey: string) {
  const normalizedKey = objectKey.trim().replace(/^\/+/, "");
  if (!normalizedKey) throw new Error("R2 object key is required");
  return `${r2PublicBaseUrl()}/${normalizedKey}`;
}

export function publicImageUrl(
  imageUrl?: string | null,
  objectKey?: string | null,
) {
  const key = objectKey?.trim();
  if (key) {
    return getR2PublicUrl(key);
  }

  if (imageUrl?.startsWith(`${LEGACY_R2_PUBLIC_ORIGIN}/`)) {
    return getR2PublicUrl(imageUrl.slice(LEGACY_R2_PUBLIC_ORIGIN.length + 1));
  }

  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) {
    return imageUrl;
  }

  const fallbackKey = imageUrl?.trim();
  return fallbackKey
    ? `/api/public/images/${fallbackKey.replace(/^\/+/, "")}`
    : null;
}
