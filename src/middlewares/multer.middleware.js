import multer from "multer";
import { randomUUID } from "node:crypto";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp");
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname}-${randomUUID()}`);
    }
});

export const upload = multer({ storage });