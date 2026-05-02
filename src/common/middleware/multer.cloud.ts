import multer from "multer";
import { multer_enum, Store_Enum } from "../enum/multer.enum";
import { tmpdir } from "node:os";
import { Request } from "express";

const multerCloud = ({
  store_type = Store_Enum.memory,
  custom_types = multer_enum.image,
  maxFileSize = 5 * 1024 * 1024
}: {
  store_type?: Store_Enum;
  custom_types?: string[];
  maxFileSize?: number
} = {}) => {
  const storage =
    store_type === Store_Enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "__" + file.originalname);
          },
        });

  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new Error("Invalid file type ❎"));
    } else {
      cb(null, true);
    }
  }

  const upload = multer({ storage, fileFilter, limits: {fileSize: maxFileSize} });

  return upload;
};

export default multerCloud;
