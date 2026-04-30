import campeonatoServico from "../servicos/campeonato.servico.js";

const TIPOS_VALIDOS = ["DUPLA", "TIME"];

const CATEGORIAS_VALIDAS = ["MASCULINO", "FEMININO", "MISTA"];

const FORMATOS_VALIDOS = [
  "MATA_MATA",
  "DUPLA_ELIMINACAO",
  "TODOS_CONTRA_TODOS",
  "GRUPOS_3X4_REPESCAGEM"
];

const MODOS_INSCRICAO_VALIDOS = [
  "POR_EQUIPE",
  "INDIVIDUAL"
];

function validarDadosCampeonato({
  nome,
  tipoParticipante,
  categoria,
  formato,
  modoInscricao
}) {
  if (!nome || !tipoParticipante || !categoria) {
    return "Nome, tipoParticipante e categoria são obrigatórios.";
  }

  if (!TIPOS_VALIDOS.includes(tipoParticipante)) {
    return "tipoParticipante inválido. Use DUPLA ou TIME.";
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return "categoria inválida. Use MASCULINO, FEMININO ou MISTA.";
  }

  if (formato && !FORMATOS_VALIDOS.includes(formato)) {
    return "formato inválido. Use MATA_MATA, DUPLA_ELIMINACAO, TODOS_CONTRA_TODOS ou GRUPOS_3X4_REPESCAGEM.";
  }

  if (modoInscricao && !MODOS_INSCRICAO_VALIDOS.includes(modoInscricao)) {
    return "modoInscricao inválido. Use POR_EQUIPE ou INDIVIDUAL.";
  }

  return null;
}

async function criar(req, res) {
  try {
    const {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao,
      quantidadeMaxima
    } = req.body;

    const erroValidacao = validarDadosCampeonato({
      nome,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao
    });

    if (erroValidacao) {
      return res.status(400).json({
        erro: erroValidacao
      });
    }

    const campeonato = await campeonatoServico.criar({
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao,
      quantidadeMaxima
    });

    return res.status(201).json(campeonato);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function listar(req, res) {
  try {
    const campeonatos = await campeonatoServico.listar();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos.",
      detalhe: error.message
    });
  }
}

async function listarMeus(req, res) {
  try {
    const campeonatos = await campeonatoServico.listar();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos administrativos.",
      detalhe: error.message
    });
  }
}

async function listarPublicos(req, res) {
  try {
    const campeonatos = await campeonatoServico.listarPublicos();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos públicos.",
      detalhe: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const campeonato = await campeonatoServico.buscarPorId(id);

    if (!campeonato) {
      return res.status(404).json({
        erro: "Campeonato não encontrado."
      });
    }

    return res.json(campeonato);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao buscar campeonato.",
      detalhe: error.message
    });
  }
}

async function excluir(req, res) {
  try {
    const { id } = req.params;

    const resultado = await campeonatoServico.excluir(id);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao,
      quantidadeMaxima
    } = req.body;

    const erroValidacao = validarDadosCampeonato({
      nome,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao
    });

    if (erroValidacao) {
      return res.status(400).json({
        erro: erroValidacao
      });
    }

    const campeonato = await campeonatoServico.atualizar(id, {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      modoInscricao,
      quantidadeMaxima
    });

    return res.json(campeonato);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  criar,
  listar,
  listarMeus,
  listarPublicos,
  buscarPorId,
  atualizar,
  excluir
};