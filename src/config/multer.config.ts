import multer from "multer";
import path from "path";
import { BadRequestException } from "../common/utils/catch-errors";
import { Request } from "express";

// Image file filter
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExt = /jpeg|jpg|png/;
  const allowedMime = ["image/jpeg", "image/png"];
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowedExt.test(ext) && allowedMime.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(
      new BadRequestException(
        "Invalid file type. Only image files are allowed."
      )
    );
  }
};

// Video file filter
const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExt = /mp4/;
  const allowedMime = ["video/mp4"];
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowedExt.test(ext) && allowedMime.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(
      new BadRequestException(
        "Invalid file type. Only video files are allowed."
      )
    );
  }
};

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});
