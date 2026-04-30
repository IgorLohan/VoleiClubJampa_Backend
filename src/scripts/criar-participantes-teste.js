import { prisma } from "../banco/prisma.js";

const campeonatoId = Number(process.argv[2]);

if (!campeonatoId) {
  console.error("Informe o ID do campeonato.");
  console.error("Exemplo: node src/scripts/criar-participantes-teste.js 3");
  process.exit(1);
}

const nomesEquipes = [
  "Vôlei Jampa A",
  "Praia Master",
  "Alta Performance",
  "Vôlei Jampa B",
  "Marés Vôlei",
  "Atlântico",
  "Instituto Sul",
  "Escolinha Futuro",
  "Praia Clube",
  "Vôlei Natal",
  "Ceará Vôlei",
  "Arena JP"
];

async function main() {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: campeonatoId
    },
    include: {
      participantes: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.participantes.length > 0) {
    throw new Error(
      `Este campeonato já possui ${campeonato.participantes.length} participante(s). Use um campeonato vazio para teste.`
    );
  }

  const jogadoresPorEquipe =
    campeonato.tipoParticipante === "DUPLA" ? 2 : 4;

  for (const nomeEquipe of nomesEquipes) {
    await prisma.participante.create({
      data: {
        nomeEquipe,
        responsavel: `Capitão ${nomeEquipe}`,
        contato: "(83) 99999-9999",
        statusInscricao: "APROVADA",
        campeonatoId,
        jogadores: {
          create: Array.from({ length: jogadoresPorEquipe }).map((_, index) => ({
            nome: `Jogador ${index + 1} - ${nomeEquipe}`,
            genero: index % 2 === 0 ? "M" : "F"
          }))
        }
      }
    });
  }

  console.log("12 participantes de teste criados com sucesso.");
  console.log(`Campeonato: ${campeonato.nome}`);
}

main()
  .catch((error) => {
    console.error("Erro ao criar participantes de teste:");
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  // node src/scripts/criar-participantes-teste.js ID_CAMP 