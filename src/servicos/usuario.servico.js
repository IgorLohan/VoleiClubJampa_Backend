import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../banco/prisma.js";
import emailServico from "./email.servico.js";

function montarUsuarioRetorno(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    contato: usuario.contato,
    dataNascimento: usuario.dataNascimento,
    sexo: usuario.sexo,
    fotoPerfil: usuario.fotoPerfil,
    papel: usuario.papel,
    criadoEm: usuario.criadoEm,
    emailVerificado: usuario.emailVerificado
  };
}

const selectUsuarioPublico = {
  id: true,
  nome: true,
  email: true,
  contato: true,
  dataNascimento: true,
  sexo: true,
  fotoPerfil: true,
  papel: true,
  criadoEm: true,
  emailVerificado: true
};

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function gerarTokenVerificacaoEmail() {
  return crypto.randomBytes(32).toString("hex");
}

function gerarDataExpiracaoToken() {
  const agora = new Date();
  agora.setHours(agora.getHours() + 24);
  return agora;
}

function prepararDataNascimento(dataNascimento) {
  if (!dataNascimento) {
    return null;
  }

  return new Date(dataNascimento);
}

async function cadastrarParticipante({
  nome,
  email,
  contato,
  senha,
  dataNascimento,
  sexo
}) {
  const emailNormalizado = normalizarEmail(email);

  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      email: emailNormalizado
    }
  });

  if (usuarioExistente) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const tokenVerificacaoEmail = gerarTokenVerificacaoEmail();
  const tokenVerificacaoExpiraEm = gerarDataExpiracaoToken();

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email: emailNormalizado,
      contato,
      dataNascimento: prepararDataNascimento(dataNascimento),
      sexo: sexo || null,
      senhaHash,
      papel: "PARTICIPANTE",
      emailVerificado: false,
      tokenVerificacaoEmail,
      tokenVerificacaoExpiraEm
    }
  });

  await emailServico.enviarEmailVerificacao({
    nome: usuario.nome,
    email: usuario.email,
    token: tokenVerificacaoEmail
  });

  return montarUsuarioRetorno(usuario);
}

async function verificarEmail(token) {
  if (!token) {
    throw new Error("Token de verificação não informado.");
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      tokenVerificacaoEmail: token
    }
  });

  if (!usuario) {
    throw new Error("Token de verificação inválido.");
  }

  if (usuario.emailVerificado) {
    return montarUsuarioRetorno(usuario);
  }

  if (
    usuario.tokenVerificacaoExpiraEm &&
    usuario.tokenVerificacaoExpiraEm < new Date()
  ) {
    throw new Error("Token de verificação expirado. Solicite um novo e-mail de verificação.");
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: usuario.id
    },
    data: {
      emailVerificado: true,
      tokenVerificacaoEmail: null,
      tokenVerificacaoExpiraEm: null
    }
  });

  return montarUsuarioRetorno(usuarioAtualizado);
}

async function reenviarEmailVerificacao(email) {
  const emailNormalizado = normalizarEmail(email);

  const usuario = await prisma.usuario.findUnique({
    where: {
      email: emailNormalizado
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (usuario.emailVerificado) {
    throw new Error("Este e-mail já foi verificado.");
  }

  const tokenVerificacaoEmail = gerarTokenVerificacaoEmail();
  const tokenVerificacaoExpiraEm = gerarDataExpiracaoToken();

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: usuario.id
    },
    data: {
      tokenVerificacaoEmail,
      tokenVerificacaoExpiraEm
    }
  });

  await emailServico.enviarEmailVerificacao({
    nome: usuarioAtualizado.nome,
    email: usuarioAtualizado.email,
    token: tokenVerificacaoEmail
  });

  return {
    mensagem: "E-mail de verificação reenviado com sucesso."
  };
}

async function loginUsuario({ email, senha }) {
  const emailNormalizado = normalizarEmail(email);

  const usuario = await prisma.usuario.findUnique({
    where: {
      email: emailNormalizado
    }
  });

  if (!usuario) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaCorreta) {
    throw new Error("E-mail ou senha inválidos.");
  }

  if (usuario.papel === "PARTICIPANTE" && !usuario.emailVerificado) {
    throw new Error("Verifique seu e-mail antes de entrar no sistema.");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      papel: usuario.papel
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    usuario: montarUsuarioRetorno(usuario)
  };
}

async function listarMinhasInscricoes(usuarioId) {
  const id = Number(usuarioId);

  const [participantesEquipe, inscricoesIndividuais] = await Promise.all([
    prisma.participante.findMany({
      where: {
        usuarioId: id
      },
      include: {
        jogadores: true,
        campeonato: true
      },
      orderBy: {
        criadoEm: "desc"
      }
    }),
    prisma.inscricaoIndividual.findMany({
      where: {
        usuarioId: id
      },
      include: {
        campeonato: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            contato: true,
            sexo: true,
            fotoPerfil: true
          }
        }
      },
      orderBy: {
        criadoEm: "desc"
      }
    })
  ]);

  const individuaisNormalizadas = inscricoesIndividuais.map((inscricao) => ({
    ...inscricao,
    tipo: "INDIVIDUAL"
  }));

  const combinadas = [...participantesEquipe, ...individuaisNormalizadas];
  combinadas.sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );

  return combinadas;
}

async function buscarPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    },
    select: selectUsuarioPublico
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  return usuario;
}

async function atualizarFotoPerfil(usuarioId, nomeArquivo) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const fotoPerfil = `/uploads/perfis/${nomeArquivo}`;

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: Number(usuarioId)
    },
    data: {
      fotoPerfil
    },
    select: selectUsuarioPublico
  });

  return usuarioAtualizado;
}

async function atualizarPerfil(usuarioId, { nome, contato, dataNascimento, sexo }) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: Number(usuarioId)
    },
    data: {
      nome,
      contato,
      dataNascimento: prepararDataNascimento(dataNascimento),
      sexo: sexo || null
    },
    select: selectUsuarioPublico
  });

  return usuarioAtualizado;
}

export default {
  cadastrarParticipante,
  verificarEmail,
  reenviarEmailVerificacao,
  loginUsuario,
  listarMinhasInscricoes,
  buscarPerfil,
  atualizarPerfil,
  atualizarFotoPerfil
};