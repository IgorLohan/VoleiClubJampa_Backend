import chaveamentoServico from "../servicos/chaveamento.servico.js";

async function encerrarInscricoes(req, res) {
  try {
    const { id } = req.params;

    const campeonato = await chaveamentoServico.encerrarInscricoes(id);

    return res.json(campeonato);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function gerarChaveamento(req, res) {
  try {
    const { id } = req.params;

    const jogos = await chaveamentoServico.gerarChaveamento(id);

    return res.status(201).json(jogos);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function listarJogos(req, res) {
  try {
    const { id } = req.params;

    const jogos = await chaveamentoServico.listarJogos(id);

    return res.json(jogos);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function reabrirInscricoes(req, res) {
  try {
    const { id } = req.params;

    const campeonato = await chaveamentoServico.reabrirInscricoes(id);

    return res.json({
      mensagem: "Inscrições reabertas com sucesso.",
      campeonato
    });
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  encerrarInscricoes,
  gerarChaveamento,
  reabrirInscricoes,
  listarJogos
};