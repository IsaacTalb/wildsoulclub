import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "wildsoulclub";
const PUBLIC_URL = process.env.R2_PUBLIC_BASE_URL || "";

export type UploadFolder =
  | "products"
  | "payments"
  | "avatars"
  | "hero"
  | "collections"
  | "banners"
  | "blogs"
  | "temp"
  | "invoices";

export interface UploadResult {
  objectKey: string;
  imageUrl: string;
  fileSize: number;
  mimeType: string;
}

export async function uploadFile(
  file: File | Buffer,
  folder: UploadFolder,
  fileName?: string
): Promise<UploadResult> {
  const ext = fileName
    ? fileName.split(".").pop()
    : file instanceof File
    ? file.name.split(".").pop()
    : "jpg";

  const objectKey = `${folder}/${uuidv4()}.${ext}`;
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const mimeType =
    file instanceof File ? file.type : `image/${ext === "png" ? "png" : "jpeg"}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: mimeType,
    })
  );

  return {
    objectKey,
    imageUrl: `${PUBLIC_URL}/${objectKey}`,
    fileSize: body.length,
    mimeType,
  };
}

export async function deleteFile(objectKey: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    })
  );
}

export async function getSignedUploadUrl(
  folder: UploadFolder,
  contentType: string,
  fileName?: string
): Promise<{ url: string; objectKey: string }> {
  const ext = fileName?.split(".").pop() || "jpg";
  const objectKey = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return { url, objectKey };
}

export async function getSignedReadUrl(objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export { r2Client, BUCKET };
