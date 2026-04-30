import inscricaoIndividualServico from "../servicos/inscricaoIndividual.servico.js";

async function criar(req, res) {
  try {
    const { id } = req.params;
    const { tamanhoCamisa, comprovantePagamento } = req.body;

    const inscricao = await inscricaoIndividualServico.criar(
      id,
      req.usuario.id,
      {
        tamanhoCamisa,
        comprovantePagamento
      }
    );

    return res.status(201).json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function listarPorCampeonato(req, res) {
  try {
    const { id } = req.params;

    const inscricoes = await inscricaoIndividualServico.listarPorCampeonato(id);

    return res.json(inscricoes);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function aprovarInscricao(req, res) {
  try {
    const { inscricaoId } = req.params;

    const inscricao = await inscricaoIndividualServico.aprovarInscricao(
      inscricaoId
    );

    return res.json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function reprovarInscricao(req, res) {
  try {
    const { inscricaoId } = req.params;
    const { observacaoAdmin } = req.body;

    const inscricao = await inscricaoIndividualServico.reprovarInscricao(
      inscricaoId,
      observacaoAdmin
    );

    return res.json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarInscricao(req, res) {
  try {
    const { inscricaoId } = req.params;
    const { tamanhoCamisa, valorTotalCentavos, observacaoAdmin } = req.body || {};

    const inscricao = await inscricaoIndividualServico.atualizarInscricao(inscricaoId, {
      tamanhoCamisa,
      valorTotalCentavos,
      observacaoAdmin
    });

    return res.json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function excluirInscricao(req, res) {
  try {
    const { inscricaoId } = req.params;

    const inscricao = await inscricaoIndividualServico.excluirInscricao(inscricaoId);

    return res.json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function montarEquipe(req, res) {
  try {
    const { id } = req.params;
    const { nomeEquipe, responsavel, contato, inscricaoIds } = req.body;

    const equipe = await inscricaoIndividualServico.montarEquipeComInscricoesIndividuais(
      id,
      {
        nomeEquipe,
        responsavel,
        contato,
        inscricaoIds
      }
    );

    return res.status(201).json(equipe);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function buscarMinhaInscricao(req, res) {
  try {
    const { id } = req.params;

    const inscricao = await inscricaoIndividualServico.buscarMinhaInscricao(
      id,
      req.usuario.id
    );

    return res.json({
      inscrito: Boolean(inscricao),
      inscricao
    });
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  criar,
  listarPorCampeonato,
  buscarMinhaInscricao,
  aprovarInscricao,
  reprovarInscricao,
  atualizarInscricao,
  excluirInscricao,
  montarEquipe
};