import adminServico from "../servicos/admin.servico.js";

async function login(req, res) {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({
        erro: "Usuário e senha são obrigatórios."
      });
    }

    const resultado = await adminServico.loginAdmin({
      login,
      senha
    });

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  login
};