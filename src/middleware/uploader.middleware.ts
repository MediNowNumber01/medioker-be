import { NextFunction, Request, Response } from "express";
import { fromBuffer } from "file-type";
import multer from "multer";

export const uploader = (fileLimit: number = 2) => {
  const storage = multer.memoryStorage();

  const limits = { fileSize: fileLimit * 1024 * 1024 };

  return multer({ storage, limits });
};

export const fileFilter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    for (const fieldname in files) {
      const fileArray = files[fieldname];
      for (const file of fileArray) {
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`File size exceeds 2 MB limit`);
        }
      }
    }
    for (const fieldname in files) {
      const fileArray = files[fieldname];

      for (const file of fileArray) {
        const type = await fromBuffer(file.buffer);

        if (!type || !allowedTypes.includes(type.mime)) {
          throw new Error(`File type ${type?.mime} is not allowed`);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
