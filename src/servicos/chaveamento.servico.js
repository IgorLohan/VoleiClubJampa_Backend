import { prisma } from "../banco/prisma.js";
import { embaralharLista } from "../utilitarios/sorteio.js";

const FORMATOS_EM_BREVE = ["DUPLA_ELIMINACAO", "TODOS_CONTRA_TODOS"];

function proximaPotenciaDeDois(numero) {
  let potencia = 1;

  while (potencia < numero) {
    potencia *= 2;
  }

  return potencia;
}

function obterBaseFasePorQuantidadeEquipes(quantidadeEquipes) {
  if (quantidadeEquipes === 2) {
    return "FINAL";
  }

  if (quantidadeEquipes === 4) {
    return "SEMIFINAL";
  }

  if (quantidadeEquipes === 8) {
    return "QUARTAS";
  }

  if (quantidadeEquipes === 16) {
    return "OITAVAS";
  }

  return `RODADA_${quantidadeEquipes}`;
}

function obterBaseDaFase(fase) {
  if (fase === "FINAL" || fase === "TERCEIRO_LUGAR") {
    return fase;
  }

  if (fase === "REPESCAGEM" || fase.startsWith("REPESCAGEM")) {
    return "REPESCAGEM";
  }

  if (fase.startsWith("FASE_GRUPOS")) {
    return "FASE_GRUPOS";
  }

  if (fase.startsWith("PRIMEIRA_FASE")) {
    return "PRIMEIRA_FASE";
  }

  if (fase.startsWith("SEMIFINAL")) {
    return "SEMIFINAL";
  }

  if (fase.startsWith("QUARTAS")) {
    return "QUARTAS";
  }

  if (fase.startsWith("OITAVAS")) {
    return "OITAVAS";
  }

  const faseSemIndice = fase.match(/^(.*)_\d+$/);

  if (faseSemIndice) {
    return faseSemIndice[1];
  }

  return fase;
}

function formatoEstaEmBreve(formato) {
  return FORMATOS_EM_BREVE.includes(formato);
}

function validarFormatoDisponivel(formato) {
  if (formatoEstaEmBreve(formato)) {
    throw new Error("Este formato de campeonato ainda está em breve.");
  }
}

function faseFoiFinalizada(jogos) {
  return (
    jogos.length > 0 &&
    jogos.every((jogo) => jogo.status === "FINALIZADO" && jogo.vencedorId)
  );
}

function obterPerdedorDoJogo(jogo) {
  if (!jogo || !jogo.vencedorId) {
    return null;
  }

  if (jogo.equipeAId === jogo.vencedorId) {
    return jogo.equipeB;
  }

  return jogo.equipeA;
}

function compararClassificacao(a, b) {
  if (b.vitorias !== a.vitorias) {
    return b.vitorias - a.vitorias;
  }

  if (b.saldoSets !== a.saldoSets) {
    return b.saldoSets - a.saldoSets;
  }

  if (b.saldoPontos !== a.saldoPontos) {
    return b.saldoPontos - a.saldoPontos;
  }

  return Math.random() - 0.5;
}

function obterClassificado(classificacao, grupo, posicao) {
  return classificacao[grupo]?.[posicao]?.participante || null;
}

function obterItemClassificacao(classificacao, grupo, posicao) {
  return classificacao[grupo]?.[posicao] || null;
}

function garantirParticipantesClassificados(participantes) {
  const todosExistem = participantes.every(Boolean);

  if (!todosExistem) {
    throw new Error(
      "Não foi possível montar a próxima fase porque a classificação dos grupos está incompleta."
    );
  }
}

function garantirJogoFinalizado(jogo, nomeFase) {
  if (!jogo || jogo.status !== "FINALIZADO" || !jogo.vencedorId) {
    throw new Error(`O jogo ${nomeFase} ainda não foi finalizado corretamente.`);
  }
}

async function criarJogosDaFase(campeonatoId, baseFase, equipes) {
  if (equipes.length < 2 || equipes.length % 2 !== 0) {
    throw new Error("Quantidade inválida de equipes para montar a fase.");
  }

  if (baseFase === "FINAL") {
    await prisma.jogo.create({
      data: {
        fase: "FINAL",
        campeonatoId: Number(campeonatoId),
        equipeAId: equipes[0].id,
        equipeBId: equipes[1].id,
        ordem: 1
      }
    });

    return;
  }

  const jogos = [];

  for (let i = 0; i < equipes.length; i += 2) {
    const numeroJogo = i / 2 + 1;

    let fase = `${baseFase}_${numeroJogo}`;

    if (baseFase === "SEMIFINAL") {
      fase = `SEMIFINAL_${numeroJogo}`;
    }

    jogos.push({
      fase,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[i].id,
      equipeBId: equipes[i + 1].id,
      ordem: numeroJogo
    });
  }

  await prisma.jogo.createMany({
    data: jogos
  });
}

function montarJogosGrupo(campeonatoId, grupo, equipes) {
  if (equipes.length !== 4) {
    throw new Error("Cada grupo precisa ter exatamente 4 equipes.");
  }

  return [
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 1,
      ordem: 1,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[3].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 1,
      ordem: 2,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[1].id,
      equipeBId: equipes[2].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 2,
      ordem: 3,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[2].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 2,
      ordem: 4,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[3].id,
      equipeBId: equipes[1].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 3,
      ordem: 5,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[1].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 3,
      ordem: 6,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[2].id,
      equipeBId: equipes[3].id
    }
  ];
}

async function gerarFaseDeGruposComRepescagem(campeonatoId, participantes) {
  if (![8, 12].includes(participantes.length)) {
    throw new Error(
      "O formato Fase de grupos + repescagem + mata-mata precisa ter 8 ou 12 participantes aprovados."
    );
  }

  const participantesEmbaralhados = embaralharLista(participantes);
  const letrasGrupos = ["A", "B", "C"];
  const quantidadeGrupos = participantes.length / 4;

  const jogos = [];

  for (let i = 0; i < quantidadeGrupos; i++) {
    const grupo = letrasGrupos[i];
    const inicio = i * 4;
    const equipesDoGrupo = participantesEmbaralhados.slice(inicio, inicio + 4);

    jogos.push(...montarJogosGrupo(campeonatoId, grupo, equipesDoGrupo));
  }

  await prisma.jogo.createMany({
    data: jogos
  });
}

function criarTabelaGrupo(jogosDoGrupo) {
  const tabela = new Map();

  function garantirEquipe(equipe) {
    if (!equipe) {
      return;
    }

    if (!tabela.has(equipe.id)) {
      tabela.set(equipe.id, {
        participante: equipe,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        setsPro: 0,
        setsContra: 0,
        pontosPro: 0,
        pontosContra: 0,
        saldoSets: 0,
        saldoPontos: 0
      });
    }
  }

  jogosDoGrupo.forEach((jogo) => {
    garantirEquipe(jogo.equipeA);
    garantirEquipe(jogo.equipeB);

    const equipeA = tabela.get(jogo.equipeAId);
    const equipeB = tabela.get(jogo.equipeBId);

    if (!equipeA || !equipeB) {
      return;
    }

    equipeA.jogos += 1;
    equipeB.jogos += 1;

    if (jogo.vencedorId === jogo.equipeAId) {
      equipeA.vitorias += 1;
      equipeB.derrotas += 1;
    }

    if (jogo.vencedorId === jogo.equipeBId) {
      equipeB.vitorias += 1;
      equipeA.derrotas += 1;
    }

    jogo.sets.forEach((set) => {
      equipeA.pontosPro += set.pontosA;
      equipeA.pontosContra += set.pontosB;

      equipeB.pontosPro += set.pontosB;
      equipeB.pontosContra += set.pontosA;

      if (set.pontosA > set.pontosB) {
        equipeA.setsPro += 1;
        equipeB.setsContra += 1;
      }

      if (set.pontosB > set.pontosA) {
        equipeB.setsPro += 1;
        equipeA.setsContra += 1;
      }
    });
  });

  const classificados = Array.from(tabela.values()).map((item) => ({
    ...item,
    saldoSets: item.setsPro - item.setsContra,
    saldoPontos: item.pontosPro - item.pontosContra
  }));

  classificados.sort((a, b) => {
    if (b.vitorias !== a.vitorias) {
      return b.vitorias - a.vitorias;
    }

    if (b.saldoSets !== a.saldoSets) {
      return b.saldoSets - a.saldoSets;
    }

    if (b.saldoPontos !== a.saldoPontos) {
      return b.saldoPontos - a.saldoPontos;
    }

    const confrontoDireto = jogosDoGrupo.find((jogo) => {
      const envolveA =
        jogo.equipeAId === a.participante.id ||
        jogo.equipeBId === a.participante.id;

      const envolveB =
        jogo.equipeAId === b.participante.id ||
        jogo.equipeBId === b.participante.id;

      return envolveA && envolveB && jogo.vencedorId;
    });

    if (confrontoDireto) {
      if (confrontoDireto.vencedorId === a.participante.id) {
        return -1;
      }

      if (confrontoDireto.vencedorId === b.participante.id) {
        return 1;
      }
    }

    return Math.random() - 0.5;
  });

  return classificados;
}

function montarClassificacaoDosGrupos(jogos) {
  const jogosFaseGrupos = jogos.filter((jogo) => jogo.fase === "FASE_GRUPOS");

  const letrasGrupos = [
    ...new Set(jogosFaseGrupos.map((jogo) => jogo.grupo).filter(Boolean))
  ].sort();

  const classificacao = {};

  letrasGrupos.forEach((grupo) => {
    const jogosDoGrupo = jogosFaseGrupos.filter((jogo) => jogo.grupo === grupo);
    classificacao[grupo] = criarTabelaGrupo(jogosDoGrupo);
  });

  return classificacao;
}

async function criarFinalETerceiroLugar(campeonatoId, semifinal1, semifinal2, jogoFinal, jogoTerceiroLugar) {
  garantirJogoFinalizado(semifinal1, "SEMIFINAL_1");
  garantirJogoFinalizado(semifinal2, "SEMIFINAL_2");

  const perdedorSemifinal1 = obterPerdedorDoJogo(semifinal1);
  const perdedorSemifinal2 = obterPerdedorDoJogo(semifinal2);

  if (!perdedorSemifinal1 || !perdedorSemifinal2) {
    throw new Error("Não foi possível identificar os perdedores das semifinais.");
  }

  const jogosParaCriar = [];

  if (!jogoFinal) {
    jogosParaCriar.push({
      fase: "FINAL",
      campeonatoId: Number(campeonatoId),
      equipeAId: semifinal1.vencedorId,
      equipeBId: semifinal2.vencedorId,
      ordem: 1
    });
  }

  if (!jogoTerceiroLugar) {
    jogosParaCriar.push({
      fase: "TERCEIRO_LUGAR",
      campeonatoId: Number(campeonatoId),
      equipeAId: perdedorSemifinal1.id,
      equipeBId: perdedorSemifinal2.id,
      ordem: 1
    });
  }

  if (jogosParaCriar.length > 0) {
    await prisma.jogo.createMany({
      data: jogosParaCriar
    });
  }
}

async function gerarProximaFaseGruposRepescagem12(campeonatoId, campeonato) {
  const jogos = campeonato.jogos;

  const jogosFaseGrupos = jogos.filter((jogo) => jogo.fase === "FASE_GRUPOS");
  const jogoRepescagem = jogos.find((jogo) => jogo.fase === "REPESCAGEM");
  const jogosQuartas = jogos.filter((jogo) => jogo.fase.startsWith("QUARTAS"));
  const jogosSemifinais = jogos.filter((jogo) => jogo.fase.startsWith("SEMIFINAL"));
  const jogoFinal = jogos.find((jogo) => jogo.fase === "FINAL");
  const jogoTerceiroLugar = jogos.find((jogo) => jogo.fase === "TERCEIRO_LUGAR");

  if (!jogosFaseGrupos.length) {
    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosFaseGrupos)) {
    return await listarJogos(campeonatoId);
  }

  const classificacao = montarClassificacaoDosGrupos(jogos);

  const primeiroA = obterClassificado(classificacao, "A", 0);
  const segundoA = obterClassificado(classificacao, "A", 1);
  const terceiroA = obterItemClassificacao(classificacao, "A", 2);

  const primeiroB = obterClassificado(classificacao, "B", 0);
  const segundoB = obterClassificado(classificacao, "B", 1);
  const terceiroB = obterItemClassificacao(classificacao, "B", 2);

  const primeiroC = obterClassificado(classificacao, "C", 0);
  const segundoC = obterClassificado(classificacao, "C", 1);
  const terceiroC = obterItemClassificacao(classificacao, "C", 2);

  garantirParticipantesClassificados([
    primeiroA,
    segundoA,
    terceiroA?.participante,
    primeiroB,
    segundoB,
    terceiroB?.participante,
    primeiroC,
    segundoC,
    terceiroC?.participante
  ]);

  const terceiros = [
    { grupo: "A", ...terceiroA },
    { grupo: "B", ...terceiroB },
    { grupo: "C", ...terceiroC }
  ];

  terceiros.sort(compararClassificacao);

  const melhorTerceiro = terceiros[0]?.participante;
  const terceirosRepescagem = terceiros.slice(1).map((item) => item.participante);

  garantirParticipantesClassificados([melhorTerceiro, ...terceirosRepescagem]);

  if (!jogoRepescagem) {
    await prisma.jogo.create({
      data: {
        fase: "REPESCAGEM",
        campeonatoId: Number(campeonatoId),
        equipeAId: terceirosRepescagem[0].id,
        equipeBId: terceirosRepescagem[1].id,
        ordem: 1
      }
    });

    return await listarJogos(campeonatoId);
  }

  if (jogoRepescagem.status !== "FINALIZADO" || !jogoRepescagem.vencedorId) {
    return await listarJogos(campeonatoId);
  }

  if (!jogosQuartas.length) {
    await prisma.jogo.createMany({
      data: [
        {
          fase: "QUARTAS_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroA.id,
          equipeBId: segundoC.id,
          ordem: 1
        },
        {
          fase: "QUARTAS_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroB.id,
          equipeBId: segundoA.id,
          ordem: 2
        },
        {
          fase: "QUARTAS_3",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroC.id,
          equipeBId: segundoB.id,
          ordem: 3
        },
        {
          fase: "QUARTAS_4",
          campeonatoId: Number(campeonatoId),
          equipeAId: melhorTerceiro.id,
          equipeBId: jogoRepescagem.vencedorId,
          ordem: 4
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosQuartas)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogosSemifinais.length) {
    const quartas1 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_1");
    const quartas2 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_2");
    const quartas3 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_3");
    const quartas4 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_4");

    garantirJogoFinalizado(quartas1, "QUARTAS_1");
    garantirJogoFinalizado(quartas2, "QUARTAS_2");
    garantirJogoFinalizado(quartas3, "QUARTAS_3");
    garantirJogoFinalizado(quartas4, "QUARTAS_4");

    await prisma.jogo.createMany({
      data: [
        {
          fase: "SEMIFINAL_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas1.vencedorId,
          equipeBId: quartas4.vencedorId,
          ordem: 1
        },
        {
          fase: "SEMIFINAL_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas2.vencedorId,
          equipeBId: quartas3.vencedorId,
          ordem: 2
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosSemifinais)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogoFinal || !jogoTerceiroLugar) {
    const semifinal1 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_1");
    const semifinal2 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_2");

    await criarFinalETerceiroLugar(
      campeonatoId,
      semifinal1,
      semifinal2,
      jogoFinal,
      jogoTerceiroLugar
    );

    return await listarJogos(campeonatoId);
  }

  return await listarJogos(campeonatoId);
}

async function gerarProximaFaseGruposRepescagem8(campeonatoId, campeonato) {
  const jogos = campeonato.jogos;

  const jogosFaseGrupos = jogos.filter((jogo) => jogo.fase === "FASE_GRUPOS");
  const jogosQuartas = jogos.filter((jogo) => jogo.fase.startsWith("QUARTAS"));
  const jogosSemifinais = jogos.filter((jogo) => jogo.fase.startsWith("SEMIFINAL"));
  const jogoFinal = jogos.find((jogo) => jogo.fase === "FINAL");
  const jogoTerceiroLugar = jogos.find((jogo) => jogo.fase === "TERCEIRO_LUGAR");

  if (!jogosFaseGrupos.length) {
    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosFaseGrupos)) {
    return await listarJogos(campeonatoId);
  }

  const classificacao = montarClassificacaoDosGrupos(jogos);

  const primeiroA = obterClassificado(classificacao, "A", 0);
  const segundoA = obterClassificado(classificacao, "A", 1);
  const terceiroA = obterClassificado(classificacao, "A", 2);
  const quartoA = obterClassificado(classificacao, "A", 3);

  const primeiroB = obterClassificado(classificacao, "B", 0);
  const segundoB = obterClassificado(classificacao, "B", 1);
  const terceiroB = obterClassificado(classificacao, "B", 2);
  const quartoB = obterClassificado(classificacao, "B", 3);

  garantirParticipantesClassificados([
    primeiroA,
    segundoA,
    terceiroA,
    quartoA,
    primeiroB,
    segundoB,
    terceiroB,
    quartoB
  ]);

  if (!jogosQuartas.length) {
    await prisma.jogo.createMany({
      data: [
        {
          fase: "QUARTAS_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroA.id,
          equipeBId: quartoB.id,
          ordem: 1
        },
        {
          fase: "QUARTAS_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: segundoA.id,
          equipeBId: terceiroB.id,
          ordem: 2
        },
        {
          fase: "QUARTAS_3",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroB.id,
          equipeBId: quartoA.id,
          ordem: 3
        },
        {
          fase: "QUARTAS_4",
          campeonatoId: Number(campeonatoId),
          equipeAId: segundoB.id,
          equipeBId: terceiroA.id,
          ordem: 4
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosQuartas)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogosSemifinais.length) {
    const quartas1 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_1");
    const quartas2 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_2");
    const quartas3 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_3");
    const quartas4 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_4");

    garantirJogoFinalizado(quartas1, "QUARTAS_1");
    garantirJogoFinalizado(quartas2, "QUARTAS_2");
    garantirJogoFinalizado(quartas3, "QUARTAS_3");
    garantirJogoFinalizado(quartas4, "QUARTAS_4");

    await prisma.jogo.createMany({
      data: [
        {
          fase: "SEMIFINAL_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas1.vencedorId,
          equipeBId: quartas2.vencedorId,
          ordem: 1
        },
        {
          fase: "SEMIFINAL_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas3.vencedorId,
          equipeBId: quartas4.vencedorId,
          ordem: 2
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosSemifinais)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogoFinal || !jogoTerceiroLugar) {
    const semifinal1 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_1");
    const semifinal2 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_2");

    await criarFinalETerceiroLugar(
      campeonatoId,
      semifinal1,
      semifinal2,
      jogoFinal,
      jogoTerceiroLugar
    );

    return await listarJogos(campeonatoId);
  }

  return await listarJogos(campeonatoId);
}

async function gerarProximaFaseGruposRepescagem(campeonatoId, campeonato) {
  const quantidadeParticipantes = campeonato.participantes.length;

  if (quantidadeParticipantes === 8) {
    return await gerarProximaFaseGruposRepescagem8(campeonatoId, campeonato);
  }

  if (quantidadeParticipantes === 12) {
    return await gerarProximaFaseGruposRepescagem12(campeonatoId, campeonato);
  }

  throw new Error(
    "O formato Fase de grupos + repescagem + mata-mata precisa ter 8 ou 12 participantes aprovados."
  );
}

async function encerrarInscricoes(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(campeonatoId)
    },
    data: {
      inscricoesAbertas: false
    }
  });

  return campeonatoAtualizado;
}

async function gerarChaveamento(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: {
        where: {
          statusInscricao: "APROVADA"
        }
      },
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  validarFormatoDisponivel(campeonato.formato);

  if (campeonato.inscricoesAbertas) {
    throw new Error("Feche as inscrições antes de gerar o chaveamento.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("O chaveamento deste campeonato já foi gerado.");
  }

  const participantes = campeonato.participantes;

  if (participantes.length < 2) {
    throw new Error("É preciso ter pelo menos 2 participantes para gerar o chaveamento.");
  }

  if (campeonato.formato === "GRUPOS_3X4_REPESCAGEM") {
    await gerarFaseDeGruposComRepescagem(campeonatoId, participantes);
    return await listarJogos(campeonatoId);
  }

  const participantesEmbaralhados = embaralharLista(participantes);
  const quantidadeParticipantes = participantesEmbaralhados.length;
  const tamanhoChave = proximaPotenciaDeDois(quantidadeParticipantes);
  const equipesNaProximaRodada = tamanhoChave / 2;
  const jogosPrimeiraRodada = quantidadeParticipantes - equipesNaProximaRodada;

  if (jogosPrimeiraRodada <= 0) {
    const baseFase = obterBaseFasePorQuantidadeEquipes(quantidadeParticipantes);
    await criarJogosDaFase(campeonatoId, baseFase, participantesEmbaralhados);
    return await listarJogos(campeonatoId);
  }

  const quantidadeEquipesNaPrimeiraRodada = jogosPrimeiraRodada * 2;
  const equipesQueJogamPrimeiraRodada = participantesEmbaralhados.slice(
    0,
    quantidadeEquipesNaPrimeiraRodada
  );

  await criarJogosDaFase(
    campeonatoId,
    "PRIMEIRA_FASE",
    equipesQueJogamPrimeiraRodada
  );

  return await listarJogos(campeonatoId);
}

async function listarJogos(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const jogos = await prisma.jogo.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: true
    },
    orderBy: [
      {
        criadoEm: "asc"
      },
      {
        id: "asc"
      }
    ]
  });

  return jogos;
}

async function gerarProximaFaseSePossivel(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: {
        where: {
          statusInscricao: "APROVADA"
        }
      },
      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true,
          sets: true
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

  validarFormatoDisponivel(campeonato.formato);

  if (campeonato.formato === "GRUPOS_3X4_REPESCAGEM") {
    return await gerarProximaFaseGruposRepescagem(campeonatoId, campeonato);
  }

  const jogos = campeonato.jogos;

  if (!jogos.length) {
    return await listarJogos(campeonatoId);
  }

  const grupos = new Map();

  jogos.forEach((jogo) => {
    if (jogo.fase === "TERCEIRO_LUGAR") {
      return;
    }

    const baseFase = obterBaseDaFase(jogo.fase);

    if (!grupos.has(baseFase)) {
      grupos.set(baseFase, []);
    }

    grupos.get(baseFase).push(jogo);
  });

  const rodadas = Array.from(grupos.entries()).map(([fase, jogosDaFase]) => ({
    fase,
    jogos: jogosDaFase
  }));

  const ultimaRodada = rodadas[rodadas.length - 1];

  if (!ultimaRodada || ultimaRodada.fase === "FINAL") {
    return await listarJogos(campeonatoId);
  }

  const rodadaFinalizada = ultimaRodada.jogos.every(
    (jogo) => jogo.status === "FINALIZADO" && jogo.vencedorId
  );

  if (!rodadaFinalizada) {
    return await listarJogos(campeonatoId);
  }

  const finalExistente = jogos.find((jogo) => jogo.fase === "FINAL");
  const terceiroExistente = jogos.find((jogo) => jogo.fase === "TERCEIRO_LUGAR");

  if (ultimaRodada.fase === "SEMIFINAL") {
    if (!finalExistente && !terceiroExistente) {
      const semifinal1 = ultimaRodada.jogos.find((jogo) => jogo.fase === "SEMIFINAL_1");
      const semifinal2 = ultimaRodada.jogos.find((jogo) => jogo.fase === "SEMIFINAL_2");

      garantirJogoFinalizado(semifinal1, "SEMIFINAL_1");
      garantirJogoFinalizado(semifinal2, "SEMIFINAL_2");

      const vencedor1 = semifinal1.vencedor;
      const vencedor2 = semifinal2.vencedor;

      const perdedor1 = obterPerdedorDoJogo(semifinal1);
      const perdedor2 = obterPerdedorDoJogo(semifinal2);

      if (!vencedor1 || !vencedor2 || !perdedor1 || !perdedor2) {
        throw new Error("Não foi possível montar final e disputa de terceiro lugar.");
      }

      await prisma.jogo.createMany({
        data: [
          {
            fase: "FINAL",
            campeonatoId: Number(campeonatoId),
            equipeAId: vencedor1.id,
            equipeBId: vencedor2.id,
            ordem: 1
          },
          {
            fase: "TERCEIRO_LUGAR",
            campeonatoId: Number(campeonatoId),
            equipeAId: perdedor1.id,
            equipeBId: perdedor2.id,
            ordem: 1
          }
        ]
      });
    }

    return await listarJogos(campeonatoId);
  }

  const vencedores = ultimaRodada.jogos.map((jogo) => jogo.vencedor);

  const idsJaUsados = new Set(
    jogos.flatMap((jogo) => [jogo.equipeAId, jogo.equipeBId]).filter(Boolean)
  );

  const equipesComBye = campeonato.participantes.filter(
    (participante) => !idsJaUsados.has(participante.id)
  );

  const classificados =
    ultimaRodada.fase === "PRIMEIRA_FASE"
      ? [...equipesComBye, ...vencedores]
      : vencedores;

  if (classificados.length < 2) {
    return await listarJogos(campeonatoId);
  }

  if (classificados.length === 2) {
    if (!finalExistente) {
      await prisma.jogo.create({
        data: {
          fase: "FINAL",
          campeonatoId: Number(campeonatoId),
          equipeAId: classificados[0].id,
          equipeBId: classificados[1].id,
          ordem: 1
        }
      });
    }

    return await listarJogos(campeonatoId);
  }

  const baseProximaFase = obterBaseFasePorQuantidadeEquipes(classificados.length);
  await criarJogosDaFase(campeonatoId, baseProximaFase, classificados);

  return await listarJogos(campeonatoId);
}

async function reabrirInscricoes(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido reabrir inscrições após o chaveamento ter sido gerado.");
  }

  if (campeonato.inscricoesAbertas) {
    throw new Error("As inscrições já estão abertas.");
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(campeonatoId)
    },
    data: {
      inscricoesAbertas: true
    }
  });

  return campeonatoAtualizado;
}

export default {
  encerrarInscricoes,
  gerarChaveamento,
  listarJogos,
  reabrirInscricoes,
  gerarProximaFaseSePossivel
};