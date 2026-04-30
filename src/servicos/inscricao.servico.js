import { prisma } from "../banco/prisma.js";
import { validarJogadoresPorCategoria } from "../utilitarios/validacoes.js";

function obterLimiteMembros(tipoParticipante) {
  if (tipoParticipante === "DUPLA") {
    return 2;
  }

  if (tipoParticipante === "TIME") {
    return 4;
  }

  throw new Error("Tipo de participante inválido.");
}

function converterSexoParaGenero(sexo) {
  if (sexo === "MASCULINO") {
    return "M";
  }

  if (sexo === "FEMININO") {
    return "F";
  }

  return null;
}

function validarCampeonatoPermiteInscricaoPorEquipe(campeonato) {
  if (campeonato.modoInscricao !== "POR_EQUIPE") {
    throw new Error(
      "Este campeonato usa inscrição individual. Não é permitido inscrever uma equipe diretamente."
    );
  }
}

function montarJogadoresAPartirDaEquipe(equipe) {
  return equipe.membros.map((membro) => {
    const genero = converterSexoParaGenero(membro.usuario?.sexo);

    if (!genero) {
      throw new Error(
        `O participante ${membro.usuario?.nome || "sem nome"} precisa ter sexo masculino ou feminino informado no perfil.`
      );
    }

    return {
      nome: membro.usuario.nome,
      genero
    };
  });
}

async function validarEquipeParaCampeonato(campeonato, equipe, usuarioId) {
  if (equipe.tipoParticipante !== campeonato.tipoParticipante) {
    throw new Error(
      `Esta equipe é do tipo ${equipe.tipoParticipante}, mas o campeonato exige ${campeonato.tipoParticipante}.`
    );
  }

  const limiteMembros = obterLimiteMembros(equipe.tipoParticipante);

  if (equipe.membros.length !== limiteMembros) {
    throw new Error(
      `Esta equipe ainda não está completa. Ela possui ${equipe.membros.length}/${limiteMembros} membros.`
    );
  }

  const usuarioFazParte = equipe.membros.some(
    (membro) => membro.usuarioId === Number(usuarioId)
  );

  if (!usuarioFazParte) {
    throw new Error("Você precisa fazer parte desta equipe para inscrevê-la.");
  }

  const inscricaoDaEquipe = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonato.id),
      equipeId: Number(equipe.id)
    }
  });

  if (inscricaoDaEquipe) {
    throw new Error("Esta equipe já está inscrita neste campeonato.");
  }

  const equipeComMesmoNome = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonato.id),
      nomeEquipe: equipe.nome
    }
  });

  if (equipeComMesmoNome) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  const idsMembros = equipe.membros.map((membro) => membro.usuarioId);

  const membroJaInscritoEmOutraEquipe = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonato.id),
      equipe: {
        membros: {
          some: {
            usuarioId: {
              in: idsMembros
            }
          }
        }
      }
    },
    include: {
      equipe: true
    }
  });

  if (membroJaInscritoEmOutraEquipe) {
    throw new Error(
      "Um ou mais membros desta equipe já estão inscritos neste campeonato por outra equipe."
    );
  }

  const jogadores = montarJogadoresAPartirDaEquipe(equipe);

  const erroValidacao = validarJogadoresPorCategoria(
    campeonato.tipoParticipante,
    campeonato.categoria,
    jogadores
  );

  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  return jogadores;
}

async function inscreverComEquipe(campeonatoId, equipeId, usuarioId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  validarCampeonatoPermiteInscricaoPorEquipe(campeonato);

  if (!campeonato.inscricoesAbertas) {
    throw new Error("As inscrições deste campeonato estão encerradas.");
  }

  if (campeonato.quantidadeMaxima !== null) {
    const quantidadeAtual = campeonato.participantes.length;

    if (quantidadeAtual >= campeonato.quantidadeMaxima) {
      throw new Error("O limite máximo de inscrições já foi atingido.");
    }
  }

  const equipe = await prisma.equipe.findUnique({
    where: {
      id: Number(equipeId)
    },
    include: {
      dono: {
        select: {
          id: true,
          nome: true,
          email: true,
          contato: true,
          sexo: true
        }
      },
      membros: {
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
        },
        orderBy: {
          criadoEm: "asc"
        }
      }
    }
  });

  if (!equipe) {
    throw new Error("Equipe não encontrada.");
  }

  const jogadores = await validarEquipeParaCampeonato(
    campeonato,
    equipe,
    usuarioId
  );

  const participante = await prisma.participante.create({
    data: {
      nomeEquipe: equipe.nome,
      responsavel: equipe.dono?.nome || "Capitão não informado",
      contato: equipe.dono?.contato || null,
      campeonatoId: Number(campeonatoId),
      usuarioId: Number(usuarioId),
      equipeId: Number(equipe.id),
      statusInscricao: "APROVADA",
      jogadores: {
        create: jogadores.map((jogador) => ({
          nome: jogador.nome,
          genero: jogador.genero
        }))
      }
    },
    include: {
      equipe: {
        include: {
          membros: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  sexo: true,
                  fotoPerfil: true
                }
              }
            }
          }
        }
      },
      jogadores: true
    }
  });

  return participante;
}

async function inscreverManual(campeonatoId, dados, usuarioId = null) {
  const { nomeEquipe, responsavel, contato, jogadores } = dados;

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  validarCampeonatoPermiteInscricaoPorEquipe(campeonato);

  if (!campeonato.inscricoesAbertas) {
    throw new Error("As inscrições deste campeonato estão encerradas.");
  }

  if (usuarioId) {
    const inscricaoDoMesmoUsuario = await prisma.participante.findFirst({
      where: {
        campeonatoId: Number(campeonatoId),
        usuarioId: Number(usuarioId)
      }
    });

    if (inscricaoDoMesmoUsuario) {
      throw new Error("Você já realizou uma inscrição neste campeonato.");
    }
  }

  if (campeonato.quantidadeMaxima !== null) {
    const quantidadeAtual = campeonato.participantes.length;

    if (quantidadeAtual >= campeonato.quantidadeMaxima) {
      throw new Error("O limite máximo de inscrições já foi atingido.");
    }
  }

  const equipeExistente = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonatoId),
      nomeEquipe
    }
  });

  if (equipeExistente) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  const erroValidacao = validarJogadoresPorCategoria(
    campeonato.tipoParticipante,
    campeonato.categoria,
    jogadores
  );

  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  const participante = await prisma.participante.create({
    data: {
      nomeEquipe,
      responsavel,
      contato: contato || null,
      campeonatoId: Number(campeonatoId),
      usuarioId,
      statusInscricao: "APROVADA",
      jogadores: {
        create: jogadores.map((jogador) => ({
          nome: jogador.nome,
          genero: jogador.genero
        }))
      }
    },
    include: {
      jogadores: true
    }
  });

  return participante;
}

async function inscrever(campeonatoId, dados, usuarioId = null) {
  const { equipeId } = dados;

  if (equipeId) {
    return await inscreverComEquipe(campeonatoId, equipeId, usuarioId);
  }

  return await inscreverManual(campeonatoId, dados, usuarioId);
}

async function atualizar(inscricaoId, dados) {
  const { nomeEquipe, responsavel, contato, jogadores } = dados;

  const participante = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      campeonato: {
        include: {
          jogos: true
        }
      }
    }
  });

  if (!participante) {
    throw new Error("Inscrição não encontrada.");
  }

  if (participante.campeonato.jogos.length > 0) {
    throw new Error("Não é permitido editar inscrição após o chaveamento ter sido gerado.");
  }

  const equipeExistente = await prisma.participante.findFirst({
    where: {
      campeonatoId: participante.campeonatoId,
      nomeEquipe,
      id: {
        not: Number(inscricaoId)
      }
    }
  });

  if (equipeExistente) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  const erroValidacao = validarJogadoresPorCategoria(
    participante.campeonato.tipoParticipante,
    participante.campeonato.categoria,
    jogadores
  );

  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  await prisma.$transaction(async (tx) => {
    await tx.jogador.deleteMany({
      where: {
        participanteId: Number(inscricaoId)
      }
    });

    await tx.participante.update({
      where: {
        id: Number(inscricaoId)
      },
      data: {
        nomeEquipe,
        responsavel,
        contato: contato || null
      }
    });

    await tx.jogador.createMany({
      data: jogadores.map((jogador) => ({
        nome: jogador.nome,
        genero: jogador.genero,
        participanteId: Number(inscricaoId)
      }))
    });
  });

  const inscricaoAtualizada = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      equipe: true,
      jogadores: true
    }
  });

  return inscricaoAtualizada;
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

  const participantes = await prisma.participante.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
    include: {
      equipe: {
        include: {
          membros: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  sexo: true,
                  fotoPerfil: true
                }
              }
            }
          }
        }
      },
      jogadores: true
    },
    orderBy: {
      criadoEm: "asc"
    }
  });

  return participantes;
}

async function excluir(inscricaoId) {
  const participante = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      campeonato: {
        include: {
          jogos: true
        }
      }
    }
  });

  if (!participante) {
    throw new Error("Inscrição não encontrada.");
  }

  if (participante.campeonato.jogos.length > 0) {
    throw new Error("Não é permitido excluir inscrição após o chaveamento ter sido gerado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.inscricaoIndividual.updateMany({
      where: {
        participanteId: Number(inscricaoId)
      },
      data: {
        status: "PENDENTE",
        participanteId: null
      }
    });

    await tx.participante.delete({
      where: {
        id: Number(inscricaoId)
      }
    });
  });

  return { mensagem: "Inscrição excluída com sucesso." };
}

export default {
  inscrever,
  listarPorCampeonato,
  atualizar,
  excluir
};