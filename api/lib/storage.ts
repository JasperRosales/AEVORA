import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ forcePathStyle: true }) // Neon requires path-style addressing

export const BUCKET = "assets"
const DOWNLOAD_TTL_SECONDS = 3600

/** Presigned GET URL for an object in the `assets` bucket. */
export function signDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: DOWNLOAD_TTL_SECONDS,
  })
}

export function putObject(key: string, body: Buffer, contentType: string) {
  return s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  )
}

export function deleteObject(key: string) {
  return s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
