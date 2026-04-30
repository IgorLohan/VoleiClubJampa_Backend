import resumoServico from "../servicos/resumo.servico.js";

async function buscarResumoAdmin(req, res) {
  try {
    const { id } = req.params;

    const resumo = await resumoServico.buscarResumoAdmin(id);

    return res.json(resumo);
  } catch (error) {
    return res.status(404).json({
      erro: error.message
    });
  }
}

async function buscarResumoPublico(req, res) {
  try {
    const { id } = req.params;

    const resumo = await resumoServico.buscarResumoPublico(id);

    return res.json(resumo);
  } catch (error) {
    return res.status(404).json({
      erro: error.message
    });
  }
}

export default {
  buscarResumoAdmin,
  buscarResumoPublico
};