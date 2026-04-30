import crypto from "crypto";
import { prisma } from "../banco/prisma.js";

function obterLimiteMembros(tipoParticipante) {
  if (tipoParticipante === "DUPLA") {
    return 2;
  }

  if (tipoParticipante === "TIME") {
    return 4;
  }

  throw new Error("Tipo de participante inválido.");
}

async function buscarEquipeComMembros(equipeId) {
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
              sexo: true,
              fotoPerfil: true
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

  return equipe;
}

async function criarEquipe(usuarioId, { nome, tipoParticipante }) {
  if (!nome || !tipoParticipante) {
    throw new Error("Nome e tipo da equipe são obrigatórios.");
  }

  if (!["DUPLA", "TIME"].includes(tipoParticipante)) {
    throw new Error("Tipo de equipe inválido. Use DUPLA ou TIME.");
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
    throw new Error("Apenas participantes podem criar equipes.");
  }

  if (!["MASCULINO", "FEMININO"].includes(usuario.sexo)) {
    throw new Error("Complete seu perfil com sexo masculino ou feminino antes de criar uma equipe.");
  }

  const equipe = await prisma.$transaction(async (tx) => {
    const novaEquipe = await tx.equipe.create({
      data: {
        nome: nome.trim(),
        tipoParticipante,
        donoId: Number(usuarioId)
      }
    });

    await tx.equipeMembro.create({
      data: {
        equipeId: novaEquipe.id,
        usuarioId: Number(usuarioId),
        papel: "DONO"
      }
    });

    return novaEquipe;
  });

  return await buscarEquipeComMembros(equipe.id);
}

async function listarMinhasEquipes(usuarioId) {
  const membros = await prisma.equipeMembro.findMany({
    where: {
      usuarioId: Number(usuarioId)
    },
    include: {
      equipe: {
        include: {
          dono: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
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
            },
            orderBy: {
              criadoEm: "asc"
            }
          }
        }
      }
    },
    orderBy: {
      criadoEm: "desc"
    }
  });

  return membros.map((membro) => membro.equipe);
}

async function buscarEquipe(usuarioId, equipeId) {
  const membro = await prisma.equipeMembro.findUnique({
    where: {
      equipeId_usuarioId: {
        equipeId: Number(equipeId),
        usuarioId: Number(usuarioId)
      }
    }
  });

  if (!membro) {
    throw new Error("Você não faz parte desta equipe.");
  }

  return await buscarEquipeComMembros(equipeId);
}

async function atualizarEquipe(usuarioId, equipeId, { nome, tipoParticipante }) {
  if (!nome || !tipoParticipante) {
    throw new Error("Nome e tipo da equipe são obrigatórios.");
  }

  if (!["DUPLA", "TIME"].includes(tipoParticipante)) {
    throw new Error("Tipo de equipe inválido. Use DUPLA ou TIME.");
  }

  const equipe = await prisma.equipe.findUnique({
    where: {
      id: Number(equipeId)
    },
    include: {
      membros: true,
      inscricoes: true
    }
  });

  if (!equipe) {
    throw new Error("Equipe não encontrada.");
  }

  if (equipe.donoId !== Number(usuarioId)) {
    throw new Error("Apenas o capitão da equipe pode editar os dados da equipe.");
  }

  const limiteNovo = obterLimiteMembros(tipoParticipante);

  if (equipe.membros.length > limiteNovo) {
    throw new Error(
      `Não é possível mudar para este tipo, pois a equipe já possui ${equipe.membros.length} membros.`
    );
  }

  if (equipe.inscricoes.length > 0 && equipe.tipoParticipante !== tipoParticipante) {
    throw new Error("Não é permitido alterar o tipo da equipe após ela ter sido usada em inscrições.");
  }

  const equipeAtualizada = await prisma.equipe.update({
    where: {
      id: Number(equipeId)
    },
    data: {
      nome: nome.trim(),
      tipoParticipante
    }
  });

  return await buscarEquipeComMembros(equipeAtualizada.id);
}

async function excluirEquipe(usuarioId, equipeId) {
  const equipe = await prisma.equipe.findUnique({
    where: {
      id: Number(equipeId)
    },
    include: {
      inscricoes: {
        include: {
          campeonato: true
        }
      }
    }
  });

  if (!equipe) {
    throw new Error("Equipe não encontrada.");
  }

  if (equipe.donoId !== Number(usuarioId)) {
    throw new Error("Apenas o capitão da equipe pode excluir a equipe.");
  }

  if (equipe.inscricoes.length > 0) {
    throw new Error(
      "Não é possível excluir esta equipe porque ela já foi usada em inscrição de campeonato."
    );
  }

  await prisma.equipe.delete({
    where: {
      id: Number(equipeId)
    }
  });

  return {
    mensagem: "Equipe excluída com sucesso."
  };
}

async function gerarConvite(usuarioId, equipeId) {
  const equipe = await prisma.equipe.findUnique({
    where: {
      id: Number(equipeId)
    },
    include: {
      membros: true
    }
  });

  if (!equipe) {
    throw new Error("Equipe não encontrada.");
  }

  if (equipe.donoId !== Number(usuarioId)) {
    throw new Error("Apenas o capitão da equipe pode gerar convite.");
  }

  const limiteMembros = obterLimiteMembros(equipe.tipoParticipante);

  if (equipe.membros.length >= limiteMembros) {
    throw new Error("Esta equipe já está completa.");
  }

  const conviteExistente = await prisma.conviteEquipe.findFirst({
    where: {
      equipeId: Number(equipeId)
    },
    orderBy: {
      criadoEm: "desc"
    },
    include: {
      equipe: true
    }
  });

  if (conviteExistente) {
    return conviteExistente;
  }

  const token = crypto.randomBytes(24).toString("hex");

  const convite = await prisma.conviteEquipe.create({
    data: {
      token,
      equipeId: Number(equipeId),
      criadoPorId: Number(usuarioId)
    },
    include: {
      equipe: true
    }
  });

  return convite;
}

async function buscarConvitePorToken(token) {
  const convite = await prisma.conviteEquipe.findUnique({
    where: {
      token
    },
    include: {
      equipe: {
        include: {
          dono: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
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
      }
    }
  });

  if (!convite) {
    throw new Error("Convite não encontrado.");
  }

  const limiteMembros = obterLimiteMembros(convite.equipe.tipoParticipante);

  if (convite.equipe.membros.length >= limiteMembros) {
    throw new Error("Esta equipe já está completa.");
  }

  return convite;
}

async function aceitarConvite(usuarioId, token) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (!["MASCULINO", "FEMININO"].includes(usuario.sexo)) {
    throw new Error("Complete seu perfil com sexo masculino ou feminino antes de entrar em uma equipe.");
  }

  const convite = await prisma.conviteEquipe.findUnique({
    where: {
      token
    },
    include: {
      equipe: {
        include: {
          membros: true
        }
      }
    }
  });

  if (!convite) {
    throw new Error("Convite não encontrado.");
  }

  const jaFazParte = convite.equipe.membros.some(
    (membro) => membro.usuarioId === Number(usuarioId)
  );

  if (jaFazParte) {
    throw new Error("Você já faz parte desta equipe.");
  }

  const limiteMembros = obterLimiteMembros(convite.equipe.tipoParticipante);

  if (convite.equipe.membros.length >= limiteMembros) {
    throw new Error("Esta equipe já está completa.");
  }

  const equipeAtualizada = await prisma.$transaction(async (tx) => {
    await tx.equipeMembro.create({
      data: {
        equipeId: convite.equipeId,
        usuarioId: Number(usuarioId),
        papel: "MEMBRO"
      }
    });

    return await tx.equipe.findUnique({
      where: {
        id: convite.equipeId
      },
      include: {
        dono: {
          select: {
            id: true,
            nome: true,
            email: true,
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
                sexo: true,
                fotoPerfil: true
              }
            }
          },
          orderBy: {
            criadoEm: "asc"
          }
        }
      }
    });
  });

  return equipeAtualizada;
}

async function removerMembroEquipe(usuarioId, equipeId, membroId) {
  const equipe = await prisma.equipe.findUnique({
    where: {
      id: Number(equipeId)
    },
    include: {
      inscricoes: true,
      membros: true
    }
  });

  if (!equipe) {
    throw new Error("Equipe não encontrada.");
  }

  if (equipe.donoId !== Number(usuarioId)) {
    throw new Error("Apenas o capitão da equipe pode remover membros.");
  }

  if (equipe.inscricoes.length > 0) {
    throw new Error(
      "Não é possível remover membros desta equipe porque ela já foi usada em inscrição de campeonato."
    );
  }

  const membro = await prisma.equipeMembro.findUnique({
    where: {
      id: Number(membroId)
    }
  });

  if (!membro || membro.equipeId !== Number(equipeId)) {
    throw new Error("Membro não encontrado nesta equipe.");
  }

  if (membro.usuarioId === Number(usuarioId)) {
    throw new Error("O capitão não pode remover a si mesmo por esta ação.");
  }

  await prisma.equipeMembro.delete({
    where: {
      id: Number(membroId)
    }
  });

  return await buscarEquipeComMembros(equipeId);
}

export default {
  criarEquipe,
  listarMinhasEquipes,
  buscarEquipe,
  atualizarEquipe,
  excluirEquipe,
  removerMembroEquipe,
  gerarConvite,
  buscarConvitePorToken,
  aceitarConvite
};