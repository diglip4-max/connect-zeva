import type { UploadedAttachment } from "@/types/upload.types";
import axiosClient from "./axiosClient";

export const uploadFiles = async (
  files: File[],
): Promise<UploadedAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await axiosClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};
