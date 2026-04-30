import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

function normalizarLoginAdmin(login) {
  return String(login || "").trim().toLowerCase();
}

async function loginAdmin({ login, senha }) {
  const loginTratado = normalizarLoginAdmin(login);

  if (!loginTratado || !senha) {
    throw new Error("Usuário e senha são obrigatórios.");
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      loginAdmin: loginTratado,
      papel: "ADMIN"
    }
  });

  if (!usuario) {
    throw new Error("Usuário ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaCorreta) {
    throw new Error("Usuário ou senha inválidos.");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      loginAdmin: usuario.loginAdmin,
      papel: usuario.papel
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    admin: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      loginAdmin: usuario.loginAdmin,
      papel: usuario.papel
    }
  };
}

export default {
  loginAdmin
};