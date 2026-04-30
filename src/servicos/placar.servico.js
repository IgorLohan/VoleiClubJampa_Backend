import { prisma } from "../banco/prisma.js";
import chaveamentoServico from "./chaveamento.servico.js";

function validarEstruturaBasicaSets(setsInformados) {
  if (!Array.isArray(setsInformados) || setsInformados.length === 0) {
    throw new Error("Informe ao menos um set para registrar o placar.");
  }

  const numerosSets = new Set();

  const setsValidos = setsInformados.every((set) => {
    const numeroValido = Number.isInteger(set.numeroSet) && set.numeroSet >= 1;
    const pontosAValidos = typeof set.pontosA === "number" && set.pontosA >= 0;
    const pontosBValidos = typeof set.pontosB === "number" && set.pontosB >= 0;
    const setsDiferentes = set.pontosA !== set.pontosB;

    if (numeroValido) {
      numerosSets.add(set.numeroSet);
    }

    return numeroValido && pontosAValidos && pontosBValidos && setsDiferentes;
  });

  if (!setsValidos) {
    throw new Error("Cada set precisa ter numeroSet, pontosA e pontosB válidos, sem empate.");
  }

  if (numerosSets.size !== setsInformados.length) {
    throw new Error("Não é permitido repetir o número do set.");
  }
}

function contarVitoriasSets(setsInformados) {
  let vitoriasEquipeA = 0;
  let vitoriasEquipeB = 0;

  for (const set of setsInformados) {
    if (set.pontosA > set.pontosB) {
      vitoriasEquipeA += 1;
    } else {
      vitoriasEquipeB += 1;
    }
  }

  return {
    vitoriasEquipeA,
    vitoriasEquipeB
  };
}

function validarRegraQuantidadeSets(jogo, setsInformados) {
  const setsOrdenados = [...setsInformados].sort(
    (a, b) => a.numeroSet - b.numeroSet
  );

  const numerosEsperados = setsOrdenados.every(
    (set, index) => set.numeroSet === index + 1
  );

  if (!numerosEsperados) {
    throw new Error("Os sets devem ser enviados em sequência: 1, 2 e 3.");
  }

  if (jogo.fase !== "FINAL") {
    if (setsOrdenados.length !== 1) {
      throw new Error("Este jogo deve ser decidido em set único.");
    }

    return setsOrdenados;
  }

  if (setsOrdenados.length < 2 || setsOrdenados.length > 3) {
    throw new Error("A final deve ter 2 sets, ou 3 sets em caso de empate nos dois primeiros.");
  }

  const set1 = setsOrdenados[0];
  const set2 = setsOrdenados[1];

  const equipeAVenceuSet1 = set1.pontosA > set1.pontosB;
  const equipeAVenceuSet2 = set2.pontosA > set2.pontosB;
  const mesmaEquipeVenceuOsDoisPrimeiros = equipeAVenceuSet1 === equipeAVenceuSet2;

  if (mesmaEquipeVenceuOsDoisPrimeiros && setsOrdenados.length === 3) {
    throw new Error(
      "O 3º set não deve ser informado se uma equipe venceu os dois primeiros sets da final."
    );
  }

  if (!mesmaEquipeVenceuOsDoisPrimeiros && setsOrdenados.length !== 3) {
    throw new Error(
      "Informe o 3º set da final, pois cada equipe venceu um dos dois primeiros sets."
    );
  }

  return setsOrdenados;
}

async function registrarPlacar(jogoId, setsInformados) {
  const jogo = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      sets: true,
      equipeA: true,
      equipeB: true,
      campeonato: true
    }
  });

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  if (!jogo.equipeAId || !jogo.equipeBId) {
    throw new Error("O jogo precisa ter duas equipes definidas.");
  }

  if (jogo.status === "FINALIZADO") {
    throw new Error("Este jogo já foi finalizado.");
  }

  validarEstruturaBasicaSets(setsInformados);

  const setsTratados = validarRegraQuantidadeSets(jogo, setsInformados);

  const { vitoriasEquipeA, vitoriasEquipeB } = contarVitoriasSets(setsTratados);

  if (vitoriasEquipeA === vitoriasEquipeB) {
    throw new Error("O jogo não pode terminar empatado em número de sets.");
  }

  const vencedorId = vitoriasEquipeA > vitoriasEquipeB ? jogo.equipeAId : jogo.equipeBId;

  await prisma.$transaction(async (tx) => {
    await tx.setJogo.deleteMany({
      where: {
        jogoId: Number(jogoId)
      }
    });

    await tx.setJogo.createMany({
      data: setsTratados.map((set) => ({
        jogoId: Number(jogoId),
        numeroSet: set.numeroSet,
        pontosA: set.pontosA,
        pontosB: set.pontosB
      }))
    });

    await tx.jogo.update({
      where: {
        id: Number(jogoId)
      },
      data: {
        status: "FINALIZADO",
        vencedorId
      }
    });
  });

  await chaveamentoServico.gerarProximaFaseSePossivel(jogo.campeonatoId);

  const jogoAtualizado = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: {
        orderBy: {
          numeroSet: "asc"
        }
      }
    }
  });

  return jogoAtualizado;
}

async function buscarJogoPorId(jogoId) {
  const jogo = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: {
        orderBy: {
          numeroSet: "asc"
        }
      }
    }
  });

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  return jogo;
}

export default {
  registrarPlacar,
  buscarJogoPorId
};