import multer from "multer";
import path from "path";
import fs from "fs";

const pastaUploads = path.resolve("uploads/perfis");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `perfil-${req.usuario.id}-${Date.now()}${extensao}`;
    cb(null, nomeArquivo);
  }
});

function fileFilter(req, file, cb) {
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(new Error("Formato de imagem inválido. Use JPG, PNG ou WEBP."));
  }

  cb(null, true);
}

const uploadFotoPerfil = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export { uploadFotoPerfil };