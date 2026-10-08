// Cloudflare R2 via S3-compatible API (PRD §26).
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
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function storageConfigured(): boolean {
  return config() !== null;
}

function client(): { s3: S3Client; bucket: string } {
  const c = config();
  if (!c) throw new Error("R2 is not configured.");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
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
