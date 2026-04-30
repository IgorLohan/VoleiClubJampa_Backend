import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function autenticarAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        erro: "Token não informado."
      });
    }

    const [, token] = authorization.split(" ");

    if (!token) {
      return res.status(401).json({
        erro: "Token inválido."
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: payload.id
      }
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "Administrador não encontrado."
      });
    }

    if (usuario.papel !== "ADMIN") {
      return res.status(403).json({
        erro: "Acesso permitido apenas para administradores."
      });
    }

    req.admin = usuario;
    next();
  } catch {
    return res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}

export { autenticarAdmin };