import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { BadException } from "../../exceptions/error.exception.js";

export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/gif"],
  files: ["application/pdf", "application/json"],
};
export const localFileUpload = ({ maxSize = 5 } = {}) => {
  //   const storage = multer.diskStorage({
  //     destination: function (req, file, cb) {
  //       cb(null, "./assets");
  //     },
  //     file: function (req, file, cb) {
  //       console.log({ file });
  //       cb(null, randomUUID() + file.originalname);
  //     },
  //   });
  //     function fileFilter(req, file, cb) {
  //     if (validation.includes(file.mimetype)) {
  //       cb(null, true); //true --> ba2olo ro7 khazenha
  //     } else {
  //       cb(new Error("invalid format", { cause: { status: 400 } }), false);
  //     }
  //   }

  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};

//Joker function
export const processFile = async ({
  customPath = "general",
  file,
  validation = [],
}) => {
  const result = await fileTypeFromBuffer(file.buffer);
  console.log({ result });
  if (!result || !validation.includes(result.mime)) {
    throw BadException("invalid file formats");
  } else {
    await mkdir(resolve(`./assets/${customPath}`), { recursive: true });
    const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;
    await writeFile(resolve(`./${uniqueFilePath}`), file.buffer);
    file.finalPath = uniqueFilePath;
  }
  return file;
};

//this function is used to process multiple files in an array
export const processFiles = async ({
  customPath,
  files = [],
  validation = [],
}) => {
  const assets = [];
  for (const file of files) {
    const uploadFile = await processFile({ customPath, file, validation });
    assets.push(uploadFile);
  }
  return assets;
};
export const processFields = async ({
  customPath,
  fields = {},
  validation = [],
}) => {
  const assets = [];
  for (const field of Object.keys(fields)) {
    const files = await processFiles({
      customPath,
      files: fields[field],
      validation,
    });
    assets.push({ field, files });
  }
  return files;
};
export const processMulterUpload = async ({
  req,
  customPath = "general",
  validation = [],
}) => {
  if (req.file) {
    await processFile({ customPath, file: req.file, validation });
  } else if (Array.isArray(req.files)) {
    await processFiles({ customPath, files: req.files, validation });
  } else if (typeof req.files == "object" && Object.keys(req.files)?.length) {
    await processFields({ customPath, fields: req.files, validation });
  }
};



// export const processFile = ({validation=[]})=>{
//     return async (req,res,next)=>{
//         const filePath = resolve(`./${req.file.path}`)
//         console.log({f:req.file , filePath})
//         const fileBuffer = await readFile(filePath)
//         console.log({fileBuffer})
//         const result = await fileTypeFromBuffer(fileBuffer)
//         console.log({result})

//         if(!result || !validation.includes(result.mime)){
//             next(new Error("invalid file fromats" , {cause:{status:400}}))
//         }

//         next()
//     }
// }
