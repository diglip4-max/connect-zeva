import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../services/upload.service";
import { successResponse } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

export const uploadAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { clinicId } = req.user!;

    if (!files || files.length === 0) {
      throw new AppError("No files provided", 400);
    }

    const uploadResults = await Promise.all(
      files.map((file) =>
        uploadToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
          clinicId,
        ),
      ),
    );

    const attachments = uploadResults.map((result) => ({
      url: result.url,
      type: result.type,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
    }));

    return successResponse(
      res,
      200,
      "Files uploaded successfully",
      attachments,
    );
  } catch (err) {
    next(err);
  }
};
