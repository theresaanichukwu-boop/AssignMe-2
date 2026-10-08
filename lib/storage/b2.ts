// Backblaze B2 via S3-compatible API (replaces Cloudflare R2 per owner
// decision; PRD §§26/33 superseded — see docs/05-storage-backblaze.md).
// Private objects, signed URLs, per-user prefixes, validated types/sizes.

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_FILE_MB = 10;
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

function config() {
  const keyId = process.env.B2_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET;
  const endpoint = process.env.B2_ENDPOINT;
  if (!keyId || !applicationKey || !bucket || !endpoint) return null;
  const regionMatch = /s3\.([^.]+)\.backblazeb2\.com/i.exec(endpoint);
  const region = regionMatch?.[1] ?? process.env.B2_REGION ?? null;
  if (!region) return null;
  return { keyId, applicationKey, bucket, endpoint, region };
}

export function storageConfigured(): boolean {
  return config() !== null;
}

function client(): { s3: S3Client; bucket: string } {
  const c = config();
  if (!c) throw new Error("Backblaze B2 is not configured.");
  const s3 = new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    credentials: { accessKeyId: c.keyId, secretAccessKey: c.applicationKey },
    forcePathStyle: false,
  });
  return { s3, bucket: c.bucket };
}

/** Safe object key: per-user prefix, sanitized filename, no traversal. */
export function objectKey(userId: string, filename: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const base = filename.split("/").pop()?.split("\\").pop() ?? "file";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
  return `users/${safeUser}/${Date.now()}-${safe}`;
}

export async function presignedUploadUrl(params: {
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ key: string; url: string }> {
  if (!ALLOWED_MIME.has(params.mimeType)) {
    throw new Error(`File type not allowed: ${params.mimeType}`);
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`File must be between 1 byte and ${MAX_FILE_MB}MB.`);
  }
  const { s3, bucket } = client();
  const key = objectKey(params.userId, params.filename);
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: params.mimeType, ContentLength: params.sizeBytes }),
    { expiresIn: 600 }
  );
  return { key, url };
}

export async function presignedDownloadUrl(key: string): Promise<string> {
  const { s3, bucket } = client();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 600 });
}
