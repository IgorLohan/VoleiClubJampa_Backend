import usuarioServico from "../servicos/usuario.servico.js";

async function listar(req, res) {
  try {
    const usuarios = await usuarioServico.listarTodosParaAdmin();
    return res.json(usuarios);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const atualizado = await usuarioServico.atualizarPorAdmin(id, req.body);
    return res.json(atualizado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  listar,
  atualizar
};
