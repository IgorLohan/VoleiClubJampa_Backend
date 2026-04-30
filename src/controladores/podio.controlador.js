import podioServico from "../servicos/podio.servico.js";

async function buscarPodio(req, res) {
  try {
    const { id } = req.params;

    const podio = await podioServico.buscarPodio(id);

    return res.json(podio);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  buscarPodio
};