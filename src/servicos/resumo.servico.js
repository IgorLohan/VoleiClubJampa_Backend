import { prisma } from "../banco/prisma.js";

function inscricaoIndividualEstaAtiva(inscricao) {
  return inscricao.status !== "CANCELADA";
}

function inscricaoIndividualVisivelPublicamente(inscricao) {
  return (
    inscricao.status !== "CANCELADA" &&
    inscricao.statusAnalise === "APROVADA"
  );
}

function montarParticipanteResumo(participante, incluirContato = false) {
  if (!participante) {
    return null;
  }

  return {
    id: participante.id,
    nomeEquipe: participante.nomeEquipe,
    responsavel: participante.responsavel,
    ...(incluirContato ? { contato: participante.contato } : {}),
    statusInscricao: participante.statusInscricao,
    criadoEm: participante.criadoEm,
    campeonatoId: participante.campeonatoId,
    usuarioId: participante.usuarioId,
    equipeId: participante.equipeId,
    jogadores: participante.jogadores || []
  };
}

function montarParticipanteJogo(participante, incluirContato = false) {
  if (!participante) {
    return null;
  }

  return {
    id: participante.id,
    nomeEquipe: participante.nomeEquipe,
    responsavel: participante.responsavel,
    ...(incluirContato ? { contato: participante.contato } : {}),
    statusInscricao: participante.statusInscricao,
    campeonatoId: participante.campeonatoId,
    usuarioId: participante.usuarioId,
    equipeId: participante.equipeId
  };
}

function montarJogoResumo(jogo, incluirContato = false) {
  return {
    id: jogo.id,
    fase: jogo.fase,
    grupo: jogo.grupo,
    rodada: jogo.rodada,
    ordem: jogo.ordem,
    status: jogo.status,
    criadoEm: jogo.criadoEm,
    campeonatoId: jogo.campeonatoId,
    equipeAId: jogo.equipeAId,
    equipeBId: jogo.equipeBId,
    vencedorId: jogo.vencedorId,
    equipeA: montarParticipanteJogo(jogo.equipeA, incluirContato),
    equipeB: montarParticipanteJogo(jogo.equipeB, incluirContato),
    vencedor: montarParticipanteJogo(jogo.vencedor, incluirContato),
    sets: jogo.sets || []
  };
}

function montarInscricaoIndividualResumo(inscricao, incluirContato = false) {
  const dadosBasicos = {
    id: inscricao.id,
    status: inscricao.status,
    statusAnalise: inscricao.statusAnalise,
    criadoEm: inscricao.criadoEm,
    campeonatoId: inscricao.campeonatoId,
    usuarioId: inscricao.usuarioId,
    participanteId: inscricao.participanteId,
    tamanhoCamisa: inscricao.tamanhoCamisa,

    usuario: inscricao.usuario
      ? {
          id: inscricao.usuario.id,
          nome: inscricao.usuario.nome,
          sexo: inscricao.usuario.sexo,
          fotoPerfil: inscricao.usuario.fotoPerfil,
          ...(incluirContato
            ? {
                email: inscricao.usuario.email,
                contato: inscricao.usuario.contato
              }
            : {})
        }
      : null,

    participante: inscricao.participante
      ? {
          id: inscricao.participante.id,
          nomeEquipe: inscricao.participante.nomeEquipe,
          responsavel: inscricao.participante.responsavel,
          statusInscricao: inscricao.participante.statusInscricao
        }
      : null
  };

  if (!incluirContato) {
    return dadosBasicos;
  }

  return {
    ...dadosBasicos,
    valorTotalCentavos: inscricao.valorTotalCentavos,
    comprovantePagamento: inscricao.comprovantePagamento,
    observacaoAdmin: inscricao.observacaoAdmin,
    analisadoEm: inscricao.analisadoEm
  };
}

function montarResumo(campeonato, incluirContato = false) {
  const inscricoesIndividuaisOriginais = campeonato.inscricoesIndividuais || [];

  const inscricoesIndividuaisParaResumo = incluirContato
    ? inscricoesIndividuaisOriginais
    : inscricoesIndividuaisOriginais.filter(inscricaoIndividualVisivelPublicamente);

  const totalParticipantes = campeonato.participantes.length;

  const totalInscricoesIndividuais = incluirContato
    ? inscricoesIndividuaisOriginais.filter(inscricaoIndividualEstaAtiva).length
    : inscricoesIndividuaisParaResumo.length;

  const totalInscricoesAguardandoAnalise = inscricoesIndividuaisOriginais.filter(
    (inscricao) =>
      inscricao.status !== "CANCELADA" &&
      inscricao.statusAnalise === "AGUARDANDO_ANALISE"
  ).length;

  const totalInscricoesAprovadas = inscricoesIndividuaisOriginais.filter(
    (inscricao) =>
      inscricao.status !== "CANCELADA" &&
      inscricao.statusAnalise === "APROVADA"
  ).length;

  const totalInscricoesReprovadas = inscricoesIndividuaisOriginais.filter(
    (inscricao) => inscricao.statusAnalise === "REPROVADA"
  ).length;

  const totalJogos = campeonato.jogos.length;

  const jogosFinalizados = campeonato.jogos.filter(
    (jogo) => jogo.status === "FINALIZADO"
  ).length;

  const final = campeonato.jogos.find(
    (jogo) => jogo.fase === "FINAL" && jogo.status === "FINALIZADO" && jogo.vencedor
  );

  const terceiroLugarJogo = campeonato.jogos.find(
    (jogo) =>
      jogo.fase === "TERCEIRO_LUGAR" &&
      jogo.status === "FINALIZADO" &&
      jogo.vencedor
  );

  let podio = null;

  if (final) {
    const primeiroLugar = final.vencedor;
    const segundoLugar =
      final.equipeAId === primeiroLugar.id ? final.equipeB : final.equipeA;

    podio = {
      primeiroLugar: montarParticipanteJogo(primeiroLugar, incluirContato),
      segundoLugar: montarParticipanteJogo(segundoLugar, incluirContato),
      terceiroLugar: terceiroLugarJogo
        ? montarParticipanteJogo(terceiroLugarJogo.vencedor, incluirContato)
        : null
    };
  }

  let statusCampeonato = "INSCRICOES_ABERTAS";

  if (!campeonato.inscricoesAbertas && campeonato.jogos.length === 0) {
    statusCampeonato = "AGUARDANDO_CHAVEAMENTO";
  }

  if (campeonato.jogos.length > 0 && !final) {
    statusCampeonato = "EM_ANDAMENTO";
  }

  if (final) {
    statusCampeonato = "FINALIZADO";
  }

  const participantes = campeonato.participantes.map((participante) =>
    montarParticipanteResumo(participante, incluirContato)
  );

  const inscricoesIndividuais = inscricoesIndividuaisParaResumo.map((inscricao) =>
    montarInscricaoIndividualResumo(inscricao, incluirContato)
  );

  const jogos = campeonato.jogos.map((jogo) =>
    montarJogoResumo(jogo, incluirContato)
  );

  return {
    campeonato: {
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
      criadoEm: campeonato.criadoEm
    },

    statusCampeonato,

    totais: {
      participantes: totalParticipantes,
      inscricoesIndividuais: totalInscricoesIndividuais,
      inscricoesAguardandoAnalise: incluirContato
        ? totalInscricoesAguardandoAnalise
        : undefined,
      inscricoesAprovadas: incluirContato
        ? totalInscricoesAprovadas
        : undefined,
      inscricoesReprovadas: incluirContato
        ? totalInscricoesReprovadas
        : undefined,
      jogos: totalJogos,
      jogosFinalizados
    },

    participantes,
    inscricoesIndividuais,
    jogos,
    podio
  };
}

async function buscarCampeonatoComRelacionamentos(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: {
        include: {
          jogadores: true
        },
        orderBy: {
          criadoEm: "asc"
        }
      },

      inscricoesIndividuais: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              contato: true,
              sexo: true,
              fotoPerfil: true
            }
          },
          participante: true
        },
        orderBy: {
          criadoEm: "asc"
        }
      },

      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true,
          sets: {
            orderBy: {
              numeroSet: "asc"
            }
          }
        },
        orderBy: {
          id: "asc"
        }
      }
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  return campeonato;
}

async function buscarResumoAdmin(campeonatoId) {
  const campeonato = await buscarCampeonatoComRelacionamentos(campeonatoId);
  return montarResumo(campeonato, true);
}

async function buscarResumoPublico(campeonatoId) {
  const campeonato = await buscarCampeonatoComRelacionamentos(campeonatoId);
  return montarResumo(campeonato, false);
}

export default {
  buscarResumoAdmin,
  buscarResumoPublico
};