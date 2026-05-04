import { prisma } from "../banco/prisma.js";
import emailServico from "./email.servico.js";

const TAMANHOS_CAMISA_VALIDOS = ["P", "M", "G", "GG", "XG", "XGG"];

// Por enquanto deixei R$ 30,00 como valor padrão.
// Depois, se o valor total com camisa for outro, basta alterar aqui.
// Exemplo: R$ 50,00 = 5000.
const VALOR_TOTAL_INSCRICAO_CENTAVOS = 3000;

function obterLimiteMembrosPorTipo(tipoParticipante) {
  if (tipoParticipante === "DUPLA") {
    return 2;
  }

  if (tipoParticipante === "TIME") {
    return 4;
  }

  throw new Error("Tipo de participante inválido.");
}

function validarTamanhoCamisa(tamanhoCamisa) {
  if (!tamanhoCamisa) {
    throw new Error("Selecione o tamanho da camisa.");
  }

  if (!TAMANHOS_CAMISA_VALIDOS.includes(tamanhoCamisa)) {
    throw new Error("Tamanho de camisa inválido. Escolha P, M, G, GG, XG ou XGG.");
  }
}

function validarComprovantePagamento(comprovantePagamento) {
  if (!comprovantePagamento) {
    throw new Error("Envie o comprovante de pagamento para finalizar a solicitação.");
  }
}

function validarUsuarioNaCategoria(usuario, campeonato) {
  if (!["MASCULINO", "FEMININO"].includes(usuario.sexo)) {
    throw new Error("Complete seu perfil com sexo masculino ou feminino antes de se inscrever.");
  }

  if (campeonato.categoria === "MASCULINO" && usuario.sexo !== "MASCULINO") {
    throw new Error("Este campeonato é masculino. Seu perfil precisa estar como masculino para se inscrever.");
  }

  if (campeonato.categoria === "FEMININO" && usuario.sexo !== "FEMININO") {
    throw new Error("Este campeonato é feminino. Seu perfil precisa estar como feminino para se inscrever.");
  }

  return true;
}

function validarJogadoresParaEquipe(inscricoes, campeonato) {
  const limiteMembros = obterLimiteMembrosPorTipo(campeonato.tipoParticipante);

  if (inscricoes.length !== limiteMembros) {
    throw new Error(
      `Para formar esta equipe, selecione exatamente ${limiteMembros} jogador(es).`
    );
  }

  const masculinos = inscricoes.filter(
    (inscricao) => inscricao.usuario?.sexo === "MASCULINO"
  ).length;

  const femininos = inscricoes.filter(
    (inscricao) => inscricao.usuario?.sexo === "FEMININO"
  ).length;

  const todosPossuemSexoValido = inscricoes.every((inscricao) =>
    ["MASCULINO", "FEMININO"].includes(inscricao.usuario?.sexo)
  );

  if (!todosPossuemSexoValido) {
    throw new Error(
      "Todos os jogadores selecionados precisam ter sexo masculino ou feminino no perfil."
    );
  }

  if (campeonato.categoria === "MASCULINO" && masculinos !== limiteMembros) {
    throw new Error("Para campeonato masculino, todos os jogadores precisam ser masculinos.");
  }

  if (campeonato.categoria === "FEMININO" && femininos !== limiteMembros) {
    throw new Error("Para campeonato feminino, todos os jogadores precisam ser femininos.");
  }

  if (campeonato.categoria === "MISTA") {
    if (campeonato.tipoParticipante === "DUPLA") {
      if (!(masculinos === 1 && femininos === 1)) {
        throw new Error("Para dupla mista, selecione 1 jogador masculino e 1 feminino.");
      }
    }

    if (campeonato.tipoParticipante === "TIME") {
      if (!(masculinos === 2 && femininos === 2)) {
        throw new Error("Para quarteto misto, selecione 2 jogadores masculinos e 2 femininos.");
      }
    }
  }
}

async function contarInscricoesIndividuaisAtivas(campeonatoId) {
  return await prisma.inscricaoIndividual.count({
    where: {
      campeonatoId: Number(campeonatoId),
      status: {
        not: "CANCELADA"
      }
    }
  });
}

async function tentarEnviarEmailInscricaoAprovada(inscricaoAtualizada) {
  try {
    await emailServico.enviarEmailInscricaoAprovada({
      nome: inscricaoAtualizada.usuario?.nome,
      email: inscricaoAtualizada.usuario?.email,
      nomeCampeonato: inscricaoAtualizada.campeonato?.nome,
      tamanhoCamisa: inscricaoAtualizada.tamanhoCamisa,
      valorTotalCentavos: inscricaoAtualizada.valorTotalCentavos,
      campeonatoId: inscricaoAtualizada.campeonatoId
    });
  } catch (error) {
    console.error(
      "Inscrição aprovada, mas houve erro ao enviar e-mail de aprovação:",
      error
    );
  }
}

async function tentarEnviarEmailInscricaoReprovada(inscricaoAtualizada) {
  try {
    await emailServico.enviarEmailInscricaoReprovada({
      nome: inscricaoAtualizada.usuario?.nome,
      email: inscricaoAtualizada.usuario?.email,
      nomeCampeonato: inscricaoAtualizada.campeonato?.nome,
      observacaoAdmin: inscricaoAtualizada.observacaoAdmin,
      campeonatoId: inscricaoAtualizada.campeonatoId
    });
  } catch (error) {
    console.error(
      "Inscrição reprovada, mas houve erro ao enviar e-mail de reprovação:",
      error
    );
  }
}

async function criar(campeonatoId, usuarioId, dados = {}) {
  const { tamanhoCamisa, comprovantePagamento } = dados;

  validarTamanhoCamisa(tamanhoCamisa);
  validarComprovantePagamento(comprovantePagamento);

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      inscricoesIndividuais: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.modoInscricao !== "INDIVIDUAL") {
    throw new Error("Este campeonato não permite inscrição individual.");
  }

  if (!campeonato.inscricoesAbertas) {
    throw new Error("As inscrições deste campeonato estão encerradas.");
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (usuario.papel !== "PARTICIPANTE") {
    throw new Error("Apenas participantes podem se inscrever.");
  }

  validarUsuarioNaCategoria(usuario, campeonato);

  const inscricaoExistente = await prisma.inscricaoIndividual.findUnique({
    where: {
      campeonatoId_usuarioId: {
        campeonatoId: Number(campeonatoId),
        usuarioId: Number(usuarioId)
      }
    }
  });

  if (inscricaoExistente) {
    throw new Error(
      "Você já possui inscrição neste campeonato e não pode se inscrever novamente."
    );
  }

  const inscricaoPorEquipe = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonatoId),
      usuarioId: Number(usuarioId)
    }
  });

  if (inscricaoPorEquipe) {
    throw new Error(
      "Você já está inscrito neste campeonato por equipe e não pode se inscrever na modalidade individual."
    );
  }

  if (campeonato.quantidadeMaxima !== null) {
    const totalInscricoesAtivas = await contarInscricoesIndividuaisAtivas(
      campeonatoId
    );

    if (totalInscricoesAtivas >= campeonato.quantidadeMaxima) {
      throw new Error("O limite máximo de jogadores individuais já foi atingido.");
    }
  }

  const inscricao = await prisma.inscricaoIndividual.create({
    data: {
      campeonatoId: Number(campeonatoId),
      usuarioId: Number(usuarioId),
      status: "PENDENTE",
      statusAnalise: "AGUARDANDO_ANALISE",
      valorTotalCentavos: VALOR_TOTAL_INSCRICAO_CENTAVOS,
      tamanhoCamisa,
      comprovantePagamento
    },
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
      campeonato: true,
      participante: true
    }
  });

  return inscricao;
}

async function listarPorCampeonato(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const inscricoes = await prisma.inscricaoIndividual.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
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
  });

  return inscricoes;
}

async function aprovarInscricao(inscricaoId) {
  const inscricao = await prisma.inscricaoIndividual.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      usuario: true,
      campeonato: true
    }
  });

  if (!inscricao) {
    throw new Error("Inscrição individual não encontrada.");
  }

  if (inscricao.status === "CANCELADA") {
    throw new Error("Não é possível aprovar uma inscrição cancelada ou reprovada.");
  }

  if (inscricao.status === "USADA_EM_EQUIPE") {
    throw new Error("Esta inscrição já foi usada em uma equipe.");
  }

  if (!inscricao.tamanhoCamisa) {
    throw new Error("Esta inscrição está sem tamanho de camisa informado.");
  }

  if (!inscricao.comprovantePagamento) {
    throw new Error("Esta inscrição está sem comprovante de pagamento.");
  }

  const inscricaoAtualizada = await prisma.inscricaoIndividual.update({
    where: {
      id: Number(inscricaoId)
    },
    data: {
      statusAnalise: "APROVADA",
      observacaoAdmin: null,
      analisadoEm: new Date()
    },
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
      campeonato: true,
      participante: true
    }
  });

  await tentarEnviarEmailInscricaoAprovada(inscricaoAtualizada);

  return inscricaoAtualizada;
}

async function reprovarInscricao(
  inscricaoId,
  observacaoAdmin = null,
  enviarEmail = true
) {
  const inscricao = await prisma.inscricaoIndividual.findUnique({
    where: {
      id: Number(inscricaoId)
    }
  });

  if (!inscricao) {
    throw new Error("Inscrição individual não encontrada.");
  }

  if (inscricao.status === "USADA_EM_EQUIPE") {
    throw new Error("Não é possível reprovar uma inscrição que já foi usada em equipe.");
  }

  const inscricaoAtualizada = await prisma.inscricaoIndividual.update({
    where: {
      id: Number(inscricaoId)
    },
    data: {
      status: "CANCELADA",
      statusAnalise: "REPROVADA",
      participanteId: null,
      observacaoAdmin: observacaoAdmin || null,
      analisadoEm: new Date()
    },
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
      campeonato: true,
      participante: true
    }
  });

  if (enviarEmail) {
    await tentarEnviarEmailInscricaoReprovada(inscricaoAtualizada);
  }

  return inscricaoAtualizada;
}

async function atualizarInscricao(inscricaoId, dados = {}) {
  const { tamanhoCamisa, valorTotalCentavos, observacaoAdmin } = dados || {};

  const inscricao = await prisma.inscricaoIndividual.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      usuario: true,
      campeonato: true
    }
  });

  if (!inscricao) {
    throw new Error("Inscrição individual não encontrada.");
  }

  if (inscricao.status === "USADA_EM_EQUIPE") {
    throw new Error("Esta inscrição já foi usada em uma equipe.");
  }

  const dataAtualizacao = {};

  if (typeof tamanhoCamisa !== "undefined") {
    validarTamanhoCamisa(tamanhoCamisa);
    dataAtualizacao.tamanhoCamisa = tamanhoCamisa;
  }

  if (typeof valorTotalCentavos !== "undefined") {
    const valor = Number(valorTotalCentavos);
    if (!Number.isFinite(valor) || valor < 0) {
      throw new Error("Valor total em centavos inválido.");
    }
    dataAtualizacao.valorTotalCentavos = Math.round(valor);
  }

  if (typeof observacaoAdmin !== "undefined") {
    const obs = String(observacaoAdmin || "").trim();
    dataAtualizacao.observacaoAdmin = obs.length ? obs : null;
  }

  if (!Object.keys(dataAtualizacao).length) {
    return inscricao;
  }

  const inscricaoAtualizada = await prisma.inscricaoIndividual.update({
    where: {
      id: Number(inscricaoId)
    },
    data: dataAtualizacao,
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
      campeonato: true,
      participante: true
    }
  });

  return inscricaoAtualizada;
}

async function excluirInscricao(inscricaoId) {
  const inscricao = await prisma.inscricaoIndividual.findUnique({
    where: {
      id: Number(inscricaoId)
    }
  });

  if (!inscricao) {
    throw new Error("Inscrição individual não encontrada.");
  }

  if (inscricao.status === "USADA_EM_EQUIPE") {
    throw new Error(
      "Não é possível excluir uma inscrição que já foi usada em equipe."
    );
  }

  await prisma.inscricaoIndividual.delete({
    where: {
      id: Number(inscricaoId)
    }
  });

  return { mensagem: "Inscrição excluída com sucesso." };
}

async function montarEquipeComInscricoesIndividuais(campeonatoId, dados) {
  const { nomeEquipe, responsavel, contato, inscricaoIds } = dados;

  if (!nomeEquipe || !inscricaoIds || !Array.isArray(inscricaoIds)) {
    throw new Error("Nome da equipe e inscrições individuais são obrigatórios.");
  }

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      jogos: true,
      participantes: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.modoInscricao !== "INDIVIDUAL") {
    throw new Error("Este campeonato não usa inscrição individual.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido montar equipes após o chaveamento ter sido gerado.");
  }

  const limiteMembros = obterLimiteMembrosPorTipo(campeonato.tipoParticipante);

  if (inscricaoIds.length !== limiteMembros) {
    throw new Error(
      `Este campeonato exige ${limiteMembros} jogador(es) por equipe.`
    );
  }

  const nomeEquipeTratado = nomeEquipe.trim();

  const equipeExistente = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonatoId),
      nomeEquipe: nomeEquipeTratado
    }
  });

  if (equipeExistente) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  if (campeonato.quantidadeMaxima !== null) {
    const limiteEquipesPossiveis = Math.floor(
      campeonato.quantidadeMaxima / limiteMembros
    );

    if (campeonato.participantes.length >= limiteEquipesPossiveis) {
      throw new Error(
        "O limite máximo de equipes possíveis com a quantidade de jogadores individuais já foi atingido."
      );
    }
  }

  const idsTratados = inscricaoIds.map((id) => Number(id));

  const inscricoes = await prisma.inscricaoIndividual.findMany({
    where: {
      id: {
        in: idsTratados
      },
      campeonatoId: Number(campeonatoId)
    },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          contato: true,
          sexo: true
        }
      }
    }
  });

  if (inscricoes.length !== idsTratados.length) {
    throw new Error("Uma ou mais inscrições individuais não foram encontradas.");
  }

  const algumaInscricaoIndisponivel = inscricoes.some(
    (inscricao) =>
      inscricao.status !== "PENDENTE" ||
      inscricao.statusAnalise !== "APROVADA" ||
      inscricao.participanteId
  );

  if (algumaInscricaoIndisponivel) {
    throw new Error(
      "Uma ou mais inscrições selecionadas ainda não foram aprovadas, já foram usadas ou não estão disponíveis."
    );
  }

  validarJogadoresParaEquipe(inscricoes, campeonato);

  const responsavelTratado =
    responsavel?.trim() || inscricoes[0]?.usuario?.nome || nomeEquipeTratado;

  const contatoTratado =
    contato?.trim() || inscricoes[0]?.usuario?.contato || null;

  const participanteCriado = await prisma.$transaction(async (tx) => {
    const participante = await tx.participante.create({
      data: {
        nomeEquipe: nomeEquipeTratado,
        responsavel: responsavelTratado,
        contato: contatoTratado,
        campeonatoId: Number(campeonatoId),
        statusInscricao: "APROVADA",
        jogadores: {
          create: inscricoes.map((inscricao) => ({
            nome: inscricao.usuario.nome,
            genero: inscricao.usuario.sexo === "MASCULINO" ? "M" : "F"
          }))
        }
      },
      include: {
        jogadores: true
      }
    });

    await tx.inscricaoIndividual.updateMany({
      where: {
        id: {
          in: idsTratados
        }
      },
      data: {
        status: "USADA_EM_EQUIPE",
        participanteId: participante.id
      }
    });

    return participante;
  });

  return participanteCriado;
}

async function buscarMinhaInscricao(campeonatoId, usuarioId) {
  const inscricao = await prisma.inscricaoIndividual.findUnique({
    where: {
      campeonatoId_usuarioId: {
        campeonatoId: Number(campeonatoId),
        usuarioId: Number(usuarioId)
      }
    },
    select: {
      id: true,
      status: true,
      statusAnalise: true,
      criadoEm: true,
      tamanhoCamisa: true,
      valorTotalCentavos: true,
      observacaoAdmin: true,
      analisadoEm: true,
      participanteId: true,
      participante: {
        select: {
          id: true,
          nomeEquipe: true,
          responsavel: true,
          statusInscricao: true
        }
      }
    }
  });

  return inscricao;
}

export default {
  criar,
  listarPorCampeonato,
  buscarMinhaInscricao,
  aprovarInscricao,
  reprovarInscricao,
  atualizarInscricao,
  excluirInscricao,
  montarEquipeComInscricoesIndividuais
};