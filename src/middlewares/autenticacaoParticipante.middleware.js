import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function autenticarParticipante(req, res, next) {
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
        erro: "Usuário não encontrado."
      });
    }

    if (usuario.papel !== "PARTICIPANTE") {
      return res.status(403).json({
        erro: "Acesso permitido apenas para participantes."
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}

export { autenticarParticipante };