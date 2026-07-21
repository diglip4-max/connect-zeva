import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

function getAttachmentType(
  mimeType: string,
): "image" | "video" | "document" | "audio" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return "file";
}

interface UploadResult {
  url: string;
  publicId: string;
  type: "image" | "video" | "document" | "audio" | "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// src/services/upload.service.ts (update)
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  clinicId: string,
): Promise<UploadResult> {
  const attachmentType = getAttachmentType(mimeType);
  const resourceType =
    attachmentType === "image"
      ? "image"
      : attachmentType === "video"
        ? "video"
        : "raw";

  // extension nikalo aur preserve karo, sirf raw (document/file) type ke liye zaroori hai
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "";
  const nameWithoutExt = originalName.includes(".")
    ? originalName.substring(0, originalName.lastIndexOf("."))
    : originalName;

  // sanitize karo - spaces aur special chars Cloudinary public_id me issue create karte hain
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_");

  const publicId =
    resourceType === "raw"
      ? `${Date.now()}-${sanitizedName}.${ext}` // raw types me extension zaroori hai URL me
      : `${Date.now()}-${sanitizedName}`; // image/video Cloudinary khud handle kar leta hai

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `zeva-messenger/${clinicId}`,
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type: attachmentType,
          fileName: originalName,
          fileSize: buffer.length,
          mimeType,
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
) {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
