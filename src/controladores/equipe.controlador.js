import equipeServico from "../servicos/equipe.servico.js";

async function criarEquipe(req, res) {
  try {
    const { nome, tipoParticipante } = req.body;

    const equipe = await equipeServico.criarEquipe(req.usuario.id, {
      nome,
      tipoParticipante
    });

    return res.status(201).json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function listarMinhasEquipes(req, res) {
  try {
    const equipes = await equipeServico.listarMinhasEquipes(req.usuario.id);
    return res.json(equipes);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function buscarEquipe(req, res) {
  try {
    const { id } = req.params;

    const equipe = await equipeServico.buscarEquipe(req.usuario.id, id);
    return res.json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarEquipe(req, res) {
  try {
    const { id } = req.params;
    const { nome, tipoParticipante } = req.body;

    const equipe = await equipeServico.atualizarEquipe(req.usuario.id, id, {
      nome,
      tipoParticipante
    });

    return res.json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function excluirEquipe(req, res) {
  try {
    const { id } = req.params;

    const resultado = await equipeServico.excluirEquipe(req.usuario.id, id);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function gerarConvite(req, res) {
  try {
    const { id } = req.params;

    const convite = await equipeServico.gerarConvite(req.usuario.id, id);

    return res.status(201).json(convite);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function buscarConvitePorToken(req, res) {
  try {
    const { token } = req.params;

    const convite = await equipeServico.buscarConvitePorToken(token);
    return res.json(convite);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function aceitarConvite(req, res) {
  try {
    const { token } = req.params;

    const equipe = await equipeServico.aceitarConvite(req.usuario.id, token);
    return res.json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function removerMembroEquipe(req, res) {
  try {
    const { id, membroId } = req.params;

    const equipe = await equipeServico.removerMembroEquipe(
      req.usuario.id,
      id,
      membroId
    );

    return res.json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  criarEquipe,
  listarMinhasEquipes,
  buscarEquipe,
  atualizarEquipe,
  excluirEquipe,
  removerMembroEquipe,
  gerarConvite,
  buscarConvitePorToken,
  aceitarConvite
};