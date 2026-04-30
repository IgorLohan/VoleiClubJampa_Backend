import { prisma } from "../banco/prisma.js";

async function buscarPodio(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true
        }
      }
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const final = campeonato.jogos.find(
    (jogo) => jogo.fase === "FINAL" && jogo.status === "FINALIZADO" && jogo.vencedor
  );

  if (!final) {
    throw new Error("A final ainda não foi concluída.");
  }

  const terceiroJogo = campeonato.jogos.find(
    (jogo) =>
      jogo.fase === "TERCEIRO_LUGAR" &&
      jogo.status === "FINALIZADO" &&
      jogo.vencedor
  );

  const primeiroLugar = final.vencedor;
  const segundoLugar =
    final.equipeAId === primeiroLugar.id ? final.equipeB : final.equipeA;
  const terceiroLugar = terceiroJogo ? terceiroJogo.vencedor : null;

  return {
    campeonato: {
      id: campeonato.id,
      nome: campeonato.nome
    },
    primeiroLugar,
    segundoLugar,
    terceiroLugar
  };
}

export default {
  buscarPodio
};