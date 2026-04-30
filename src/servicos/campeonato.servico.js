import { prisma } from "../banco/prisma.js";

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

function valorFoiEnviado(valor) {
  return valor !== undefined && valor !== null && valor !== "";
}

function validarFormatoCampeonato(formato) {
  if (!formato) {
    return "MATA_MATA";
  }

  if (!FORMATOS_VALIDOS.includes(formato)) {
    throw new Error("Formato de campeonato inválido.");
  }

  return formato;
}

function validarModoInscricao(modoInscricao) {
  if (!modoInscricao) {
    return "POR_EQUIPE";
  }

  if (!MODOS_INSCRICAO_VALIDOS.includes(modoInscricao)) {
    throw new Error("Modo de inscrição inválido.");
  }

  return modoInscricao;
}

function prepararQuantidadeMaxima(formato, modoInscricao, quantidadeMaxima) {
  if (
    quantidadeMaxima === null ||
    quantidadeMaxima === undefined ||
    quantidadeMaxima === ""
  ) {
    if (formato === "GRUPOS_3X4_REPESCAGEM" && modoInscricao === "POR_EQUIPE") {
      return 12;
    }

    return null;
  }

  const quantidade = Number(quantidadeMaxima);

  if (Number.isNaN(quantidade) || quantidade < 2) {
    throw new Error("A quantidade máxima precisa ser um número maior ou igual a 2.");
  }

  if (
    formato === "GRUPOS_3X4_REPESCAGEM" &&
    modoInscricao === "POR_EQUIPE" &&
    ![8, 12].includes(quantidade)
  ) {
    throw new Error(
      "No formato com fase de grupos por equipe, a quantidade máxima precisa ser 8 ou 12 equipes."
    );
  }

  return quantidade;
}

function contarInscricoesIndividuaisAprovadas(inscricoesIndividuais) {
  return inscricoesIndividuais.filter(
    (inscricao) =>
      inscricao.status !== "CANCELADA" &&
      inscricao.statusAnalise === "APROVADA"
  ).length;
}

async function criar(dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    formato,
    modoInscricao,
    quantidadeMaxima
  } = dados;

  const formatoValidado = validarFormatoCampeonato(formato);
  const modoInscricaoValidado = validarModoInscricao(modoInscricao);

  const quantidadeMaximaTratada = prepararQuantidadeMaxima(
    formatoValidado,
    modoInscricaoValidado,
    quantidadeMaxima
  );

  const campeonato = await prisma.campeonato.create({
    data: {
      nome,
      data: data ? new Date(data) : null,
      local: local || null,
      tipoParticipante,
      categoria,
      formato: formatoValidado,
      modoInscricao: modoInscricaoValidado,
      quantidadeMaxima: quantidadeMaximaTratada
    }
  });

  return campeonato;
}

async function listar() {
  const campeonatos = await prisma.campeonato.findMany({
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos;
}

async function listarPorOrganizador() {
  const campeonatos = await prisma.campeonato.findMany({
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos;
}

async function listarPublicos() {
  const campeonatos = await prisma.campeonato.findMany({
    include: {
      participantes: true,
      inscricoesIndividuais: true,
      jogos: {
        include: {
          vencedor: true
        }
      }
    },
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos.map((campeonato) => {
    const totalParticipantes = campeonato.participantes.length;
    const totalInscricoesIndividuaisAprovadas =
      contarInscricoesIndividuaisAprovadas(campeonato.inscricoesIndividuais);

    const totalJogos = campeonato.jogos.length;
    const jogosFinalizados = campeonato.jogos.filter(
      (jogo) => jogo.status === "FINALIZADO"
    ).length;

    const finalFinalizada = campeonato.jogos.find(
      (jogo) =>
        jogo.fase === "FINAL" &&
        jogo.status === "FINALIZADO" &&
        jogo.vencedor
    );

    let statusCampeonato = "INSCRICOES_ABERTAS";

    if (!campeonato.inscricoesAbertas && totalJogos === 0) {
      statusCampeonato = "AGUARDANDO_CHAVEAMENTO";
    }

    if (totalJogos > 0 && !finalFinalizada) {
      statusCampeonato = "EM_ANDAMENTO";
    }

    if (finalFinalizada) {
      statusCampeonato = "FINALIZADO";
    }

    return {
      id: campeonato.id,
      nome: campeonato.nome,
      data: campeonato.data,
      local: campeonato.local,
      tipoParticipante: campeonato.tipoParticipante,
      categoria: campeonato.categoria,
      formato: campeonato.formato,
      modoInscricao: campeonato.modoInscricao,
      quantidadeMaxima: campeonato.quantidadeMaxima,
      inscricoesAbertas: campeonato.inscricoesAbertas,
      criadoEm: campeonato.criadoEm,
      totais: {
        participantes: totalParticipantes,
        inscricoesIndividuais: totalInscricoesIndividuaisAprovadas,
        jogos: totalJogos,
        jogosFinalizados
      },
      statusCampeonato
    };
  });
}

async function buscarPorId(id) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    }
  });

  return campeonato;
}

async function atualizar(id, dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    formato,
    modoInscricao,
    quantidadeMaxima
  } = dados;

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido editar o campeonato após o chaveamento ter sido gerado.");
  }

  const totalEquipesInscritas = await prisma.participante.count({
    where: {
      campeonatoId: Number(id)
    }
  });

  const totalInscricoesIndividuaisAtivas = await prisma.inscricaoIndividual.count({
    where: {
      campeonatoId: Number(id),
      status: {
        not: "CANCELADA"
      }
    }
  });

  const possuiInscricoes =
    totalEquipesInscritas > 0 || totalInscricoesIndividuaisAtivas > 0;

  const nomeFinal = valorFoiEnviado(nome) ? nome : campeonato.nome;
  const dataFinal = data !== undefined ? (data ? new Date(data) : null) : campeonato.data;
  const localFinal = local !== undefined ? (local || null) : campeonato.local;

  const tipoParticipanteFinal = valorFoiEnviado(tipoParticipante)
    ? tipoParticipante
    : campeonato.tipoParticipante;

  const categoriaFinal = valorFoiEnviado(categoria)
    ? categoria
    : campeonato.categoria;

  const formatoFinal = valorFoiEnviado(formato)
    ? validarFormatoCampeonato(formato)
    : campeonato.formato;

  const modoInscricaoFinal = valorFoiEnviado(modoInscricao)
    ? validarModoInscricao(modoInscricao)
    : campeonato.modoInscricao;

  if (possuiInscricoes) {
    if (tipoParticipanteFinal !== campeonato.tipoParticipante) {
      throw new Error("Não é permitido alterar o tipo após existirem inscrições.");
    }

    if (categoriaFinal !== campeonato.categoria) {
      throw new Error("Não é permitido alterar a categoria após existirem inscrições.");
    }

    if (formatoFinal !== campeonato.formato) {
      throw new Error("Não é permitido alterar o formato após existirem inscrições.");
    }

    if (modoInscricaoFinal !== campeonato.modoInscricao) {
      throw new Error("Não é permitido alterar o modo de inscrição após existirem inscrições.");
    }
  }

  const quantidadeMaximaTratada = quantidadeMaxima !== undefined
    ? prepararQuantidadeMaxima(
        formatoFinal,
        modoInscricaoFinal,
        quantidadeMaxima
      )
    : campeonato.quantidadeMaxima;

  if (
    modoInscricaoFinal === "POR_EQUIPE" &&
    quantidadeMaximaTratada !== null &&
    quantidadeMaximaTratada !== undefined &&
    quantidadeMaximaTratada < totalEquipesInscritas
  ) {
    throw new Error(
      `A quantidade máxima de equipes não pode ser menor que o total atual de equipes inscritas (${totalEquipesInscritas}).`
    );
  }

  if (
    modoInscricaoFinal === "INDIVIDUAL" &&
    quantidadeMaximaTratada !== null &&
    quantidadeMaximaTratada !== undefined &&
    quantidadeMaximaTratada < totalInscricoesIndividuaisAtivas
  ) {
    throw new Error(
      `A quantidade máxima de jogadores não pode ser menor que o total atual de jogadores individuais ativos (${totalInscricoesIndividuaisAtivas}).`
    );
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(id)
    },
    data: {
      nome: nomeFinal,
      data: dataFinal,
      local: localFinal,
      tipoParticipante: tipoParticipanteFinal,
      categoria: categoriaFinal,
      formato: formatoFinal,
      modoInscricao: modoInscricaoFinal,
      quantidadeMaxima: quantidadeMaximaTratada
    }
  });

  return campeonatoAtualizado;
}

async function excluir(id) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      jogos: true,
      participantes: true,
      inscricoesIndividuais: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido excluir o campeonato após o chaveamento ter sido gerado.");
  }

  await prisma.$transaction(async (tx) => {
    const participantes = await tx.participante.findMany({
      where: {
        campeonatoId: Number(id)
      },
      select: {
        id: true
      }
    });

    const participanteIds = participantes.map((participante) => participante.id);

    await tx.inscricaoIndividual.deleteMany({
      where: {
        campeonatoId: Number(id)
      }
    });

    if (participanteIds.length > 0) {
      await tx.jogador.deleteMany({
        where: {
          participanteId: {
            in: participanteIds
          }
        }
      });
    }

    await tx.participante.deleteMany({
      where: {
        campeonatoId: Number(id)
      }
    });

    await tx.campeonato.delete({
      where: {
        id: Number(id)
      }
    });
  });

  return { mensagem: "Campeonato excluído com sucesso." };
}

export default {
  criar,
  listar,
  listarPorOrganizador,
  listarPublicos,
  buscarPorId,
  atualizar,
  excluir
};