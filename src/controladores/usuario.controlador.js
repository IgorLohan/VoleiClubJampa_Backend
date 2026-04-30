import usuarioServico from "../servicos/usuario.servico.js";

const SEXOS_VALIDOS = [
  "MASCULINO",
  "FEMININO"
];

function validarSexo(sexo) {
  if (!sexo) {
    return false;
  }

  return SEXOS_VALIDOS.includes(sexo);
}

async function cadastro(req, res) {
  try {
    const { nome, email, contato, senha, dataNascimento, sexo } = req.body;

    if (!nome || !email || !contato || !senha || !dataNascimento || !sexo) {
      return res.status(400).json({
        erro: "Nome, e-mail, contato, data de nascimento, sexo e senha são obrigatórios."
      });
    }

    if (!validarSexo(sexo)) {
      return res.status(400).json({
        erro: "Sexo inválido. Use MASCULINO ou FEMININO."
      });
    }

    const usuario = await usuarioServico.cadastrarParticipante({
      nome,
      email,
      contato,
      senha,
      dataNascimento,
      sexo
    });

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso. Verifique seu e-mail para ativar sua conta.",
      usuario
    });
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function verificarEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        erro: "Token de verificação não informado."
      });
    }

    const usuario = await usuarioServico.verificarEmail(token);

    return res.json({
      mensagem: "E-mail verificado com sucesso. Agora você já pode entrar no sistema.",
      usuario
    });
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function reenviarEmailVerificacao(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        erro: "E-mail é obrigatório."
      });
    }

    const resultado = await usuarioServico.reenviarEmailVerificacao(email);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios."
      });
    }

    const resultado = await usuarioServico.loginUsuario({
      email,
      senha
    });

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function minhasInscricoes(req, res) {
  try {
    const inscricoes = await usuarioServico.listarMinhasInscricoes(req.usuario.id);
    return res.json(inscricoes);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function perfil(req, res) {
  try {
    const usuario = await usuarioServico.buscarPerfil(req.usuario.id);
    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        erro: "Nenhuma imagem enviada."
      });
    }

    const usuario = await usuarioServico.atualizarFotoPerfil(
      req.usuario.id,
      req.file.filename
    );

    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarPerfil(req, res) {
  try {
    const { nome, contato, dataNascimento, sexo } = req.body;

    if (!nome || !contato || !dataNascimento || !sexo) {
      return res.status(400).json({
        erro: "Nome, contato, data de nascimento e sexo são obrigatórios."
      });
    }

    if (!validarSexo(sexo)) {
      return res.status(400).json({
        erro: "Sexo inválido. Use MASCULINO ou FEMININO."
      });
    }

    const usuario = await usuarioServico.atualizarPerfil(req.usuario.id, {
      nome,
      contato,
      dataNascimento,
      sexo
    });

    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  cadastro,
  verificarEmail,
  reenviarEmailVerificacao,
  login,
  minhasInscricoes,
  perfil,
  atualizarPerfil,
  atualizarFotoPerfil
};