-- CreateEnum
CREATE TYPE "TipoParticipante" AS ENUM ('DUPLA', 'TIME');

-- CreateEnum
CREATE TYPE "CategoriaCampeonato" AS ENUM ('MASCULINO', 'FEMININO', 'MISTA');

-- CreateEnum
CREATE TYPE "StatusInscricao" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('PENDENTE', 'FINALIZADO');

-- CreateTable
CREATE TABLE "Campeonato" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3),
    "local" TEXT,
    "tipoParticipante" "TipoParticipante" NOT NULL,
    "categoria" "CategoriaCampeonato" NOT NULL,
    "quantidadeMaxima" INTEGER,
    "inscricoesAbertas" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campeonato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participante" (
    "id" SERIAL NOT NULL,
    "nomeEquipe" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "contato" TEXT,
    "statusInscricao" "StatusInscricao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campeonatoId" INTEGER NOT NULL,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "participanteId" INTEGER NOT NULL,

    CONSTRAINT "Jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" SERIAL NOT NULL,
    "fase" TEXT NOT NULL,
    "status" "StatusJogo" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campeonatoId" INTEGER NOT NULL,
    "equipeAId" INTEGER,
    "equipeBId" INTEGER,
    "vencedorId" INTEGER,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetJogo" (
    "id" SERIAL NOT NULL,
    "numeroSet" INTEGER NOT NULL,
    "pontosA" INTEGER NOT NULL,
    "pontosB" INTEGER NOT NULL,
    "jogoId" INTEGER NOT NULL,

    CONSTRAINT "SetJogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participante_campeonatoId_nomeEquipe_key" ON "Participante"("campeonatoId", "nomeEquipe");

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_equipeAId_fkey" FOREIGN KEY ("equipeAId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_equipeBId_fkey" FOREIGN KEY ("equipeBId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_vencedorId_fkey" FOREIGN KEY ("vencedorId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetJogo" ADD CONSTRAINT "SetJogo_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
