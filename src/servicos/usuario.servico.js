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

const selectUsuarioAdmin = {
  id: true,
  nome: true,
  email: true,
  loginAdmin: true,
  contato: true,
  dataNascimento: true,
  sexo: true,
  fotoPerfil: true,
  papel: true,
  criadoEm: true,
  emailVerificado: true
};

function normalizarLoginAdmin(login) {
  return String(login || "").trim().toLowerCase();
}

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

async function atualizarPerfil(usuarioId, { nome, contato, dataNascimento, sexo } = {}) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const data = {};
  if (nome !== undefined) data.nome = nome;
  if (contato !== undefined) data.contato = contato;
  if (dataNascimento !== undefined) {
    data.dataNascimento = prepararDataNascimento(dataNascimento);
  }
  if (sexo !== undefined) data.sexo = sexo || null;

  if (!Object.keys(data).length) {
    return await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
      select: selectUsuarioPublico
    });
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: Number(usuarioId)
    },
    data,
    select: selectUsuarioPublico
  });

  return usuarioAtualizado;
}

async function listarTodosParaAdmin() {
  return await prisma.usuario.findMany({
    orderBy: {
      criadoEm: "desc"
    },
    select: selectUsuarioAdmin
  });
}

async function atualizarPorAdmin(usuarioAlvoId, dados = {}) {
  const {
    nome,
    email,
    loginAdmin,
    contato,
    dataNascimento,
    sexo,
    papel,
    emailVerificado,
    novaSenha
  } = dados;

  const alvo = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioAlvoId)
    }
  });

  if (!alvo) {
    throw new Error("Usuário não encontrado.");
  }

  const papelFinal =
    papel !== undefined && papel !== null ? papel : alvo.papel;

  if (!["ADMIN", "PARTICIPANTE"].includes(papelFinal)) {
    throw new Error("Papel inválido.");
  }

  if (alvo.papel === "ADMIN" && papelFinal === "PARTICIPANTE") {
    const outrosAdmins = await prisma.usuario.count({
      where: {
        papel: "ADMIN",
        id: {
          not: alvo.id
        }
      }
    });

    if (outrosAdmins === 0) {
      throw new Error("Não é possível remover o único administrador do sistema.");
    }
  }

  const sexosPermitidos = [
    "MASCULINO",
    "FEMININO",
    "OUTRO",
    "PREFIRO_NAO_INFORMAR"
  ];

  const data = {};

  if (nome !== undefined) {
    data.nome = String(nome || "").trim();
    if (!data.nome) {
      throw new Error("Nome é obrigatório.");
    }
  }

  if (email !== undefined) {
    const emailNormalizado = normalizarEmail(email);
    if (!emailNormalizado) {
      throw new Error("E-mail inválido.");
    }

    const existe = await prisma.usuario.findFirst({
      where: {
        email: emailNormalizado,
        NOT: {
          id: alvo.id
        }
      }
    });

    if (existe) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    data.email = emailNormalizado;
  }

  if (contato !== undefined) {
    data.contato = contato === null || contato === "" ? null : String(contato).trim();
  }

  if (dataNascimento !== undefined) {
    data.dataNascimento = prepararDataNascimento(dataNascimento);
  }

  if (sexo !== undefined) {
    if (sexo === null || sexo === "") {
      data.sexo = null;
    } else if (!sexosPermitidos.includes(sexo)) {
      throw new Error("Sexo inválido.");
    } else {
      data.sexo = sexo;
    }
  }

  if (papel !== undefined && papel !== null) {
    data.papel = papelFinal;
  }

  if (emailVerificado !== undefined) {
    data.emailVerificado = Boolean(emailVerificado);
  }

  let loginTratado =
    loginAdmin === undefined
      ? alvo.loginAdmin
      : loginAdmin === null || loginAdmin === ""
        ? null
        : normalizarLoginAdmin(loginAdmin);

  if (papelFinal === "PARTICIPANTE") {
    loginTratado = null;
  }

  if (loginAdmin !== undefined || papel !== undefined) {
    data.loginAdmin = loginTratado;
  }

  if (papelFinal === "ADMIN" && !loginTratado) {
    throw new Error(
      "Contas com papel Administrador precisam de um login de administrador definido."
    );
  }

  if (loginAdmin !== undefined && loginTratado) {
    const existeLogin = await prisma.usuario.findFirst({
      where: {
        loginAdmin: loginTratado,
        NOT: {
          id: alvo.id
        }
      }
    });

    if (existeLogin) {
      throw new Error("Já existe um usuário com este login de administrador.");
    }
  }

  if (novaSenha !== undefined && novaSenha !== null && String(novaSenha).trim() !== "") {
    if (String(novaSenha).length < 6) {
      throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
    }

    data.senhaHash = await bcrypt.hash(String(novaSenha), 10);
  }

  if (!Object.keys(data).length) {
    return await prisma.usuario.findUnique({
      where: {
        id: alvo.id
      },
      select: selectUsuarioAdmin
    });
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: alvo.id
    },
    data,
    select: selectUsuarioAdmin
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
  atualizarFotoPerfil,
  listarTodosParaAdmin,
  atualizarPorAdmin
};