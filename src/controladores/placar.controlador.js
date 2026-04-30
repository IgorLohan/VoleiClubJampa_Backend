import placarServico from "../servicos/placar.servico.js";

async function registrarPlacar(req, res) {
  try {
    const { id } = req.params;
    const { sets } = req.body;

    if (!sets) {
      return res.status(400).json({
        erro: "O campo sets é obrigatório."
      });
    }

    const jogo = await placarServico.registrarPlacar(id, sets);

    return res.json(jogo);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function buscarJogoPorId(req, res) {
  try {
    const { id } = req.params;

    const jogo = await placarServico.buscarJogoPorId(id);

    return res.json(jogo);
  } catch (error) {
    return res.status(404).json({
      erro: error.message
    });
  }
}

export default {
  registrarPlacar,
  buscarJogoPorId
};