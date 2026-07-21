export interface UploadedAttachment {
  url: string;
  type: "image" | "video" | "document" | "audio" | "file";
  fileName: string;
  fileSize: number;
  mimeType: string;
}
