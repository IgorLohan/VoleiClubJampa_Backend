import bcrypt from "bcryptjs";
import { prisma } from "../banco/prisma.js";

async function main() {
  const nome = "seu nome";
  const email = "seunome@voleiclubjampa.com";
  const loginAdmin = "coloque-seu-usuario";
  const senha = "coloque-sua-senha";

  const emailTratado = email.trim().toLowerCase();
  const loginAdminTratado = loginAdmin.trim().toLowerCase();

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuarioComEmailExistente = await prisma.usuario.findUnique({
    where: {
      email: emailTratado
    }
  });

  const usuarioComLoginExistente = await prisma.usuario.findUnique({
    where: {
      loginAdmin: loginAdminTratado
    }
  });

  if (
    usuarioComEmailExistente &&
    usuarioComLoginExistente &&
    usuarioComEmailExistente.id !== usuarioComLoginExistente.id
  ) {
    throw new Error(
      "Já existe um usuário com esse e-mail e outro usuário diferente com esse loginAdmin. Ajuste manualmente no banco antes de continuar."
    );
  }

  const usuarioExistente = usuarioComEmailExistente || usuarioComLoginExistente;

  if (usuarioExistente) {
    const adminAtualizado = await prisma.usuario.update({
      where: {
        id: usuarioExistente.id
      },
      data: {
        nome,
        email: emailTratado,
        loginAdmin: loginAdminTratado,
        senhaHash,
        papel: "ADMIN",
        emailVerificado: true,
        tokenVerificacaoEmail: null,
        tokenVerificacaoExpiraEm: null
      }
    });

    console.log("Admin atualizado com sucesso:");
    console.log({
      id: adminAtualizado.id,
      nome: adminAtualizado.nome,
      email: adminAtualizado.email,
      loginAdmin: adminAtualizado.loginAdmin,
      papel: adminAtualizado.papel,
      emailVerificado: adminAtualizado.emailVerificado
    });

    return;
  }

  const admin = await prisma.usuario.create({
    data: {
      nome,
      email: emailTratado,
      loginAdmin: loginAdminTratado,
      senhaHash,
      papel: "ADMIN",
      emailVerificado: true,
      tokenVerificacaoEmail: null,
      tokenVerificacaoExpiraEm: null
    }
  });

  console.log("Admin criado com sucesso:");
  console.log({
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    loginAdmin: admin.loginAdmin,
    papel: admin.papel,
    emailVerificado: admin.emailVerificado
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar/atualizar admin:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Para rodar:
// node src/scripts/criar-admin.js