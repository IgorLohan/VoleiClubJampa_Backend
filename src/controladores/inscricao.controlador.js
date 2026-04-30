import inscricaoServico from "../servicos/inscricao.servico.js";

async function inscrever(req, res) {
  try {
    const { id } = req.params;
    const { equipeId, nomeEquipe, responsavel, contato, jogadores } = req.body;

    if (!equipeId && (!nomeEquipe || !responsavel || !jogadores)) {
      return res.status(400).json({
        erro: "Informe equipeId ou os dados manuais da inscrição."
      });
    }

    const participante = await inscricaoServico.inscrever(
      id,
      {
        equipeId,
        nomeEquipe,
        responsavel,
        contato,
        jogadores
      },
      req.usuario.id
    );

    return res.status(201).json(participante);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { nomeEquipe, responsavel, contato, jogadores } = req.body;

    if (!nomeEquipe || !responsavel || !jogadores || !Array.isArray(jogadores) || !jogadores.length) {
      return res.status(400).json({
        erro: "nomeEquipe, responsavel e jogadores são obrigatórios."
      });
    }

    const inscricao = await inscricaoServico.atualizar(id, {
      nomeEquipe,
      responsavel,
      contato,
      jogadores
    });

    return res.json(inscricao);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function listarPorCampeonato(req, res) {
  try {
    const { id } = req.params;

    const participantes = await inscricaoServico.listarPorCampeonato(id);

    return res.json(participantes);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function excluir(req, res) {
  try {
    const { id } = req.params;

    const resultado = await inscricaoServico.excluir(id);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  inscrever,
  listarPorCampeonato,
  atualizar,
  excluir
};