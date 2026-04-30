-- CreateEnum
CREATE TYPE "ModoInscricaoCampeonato" AS ENUM ('POR_EQUIPE', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "StatusInscricaoIndividual" AS ENUM ('PENDENTE', 'USADA_EM_EQUIPE', 'CANCELADA');

-- AlterTable
ALTER TABLE "Campeonato" ADD COLUMN     "modoInscricao" "ModoInscricaoCampeonato" NOT NULL DEFAULT 'POR_EQUIPE';

-- CreateTable
CREATE TABLE "InscricaoIndividual" (
    "id" SERIAL NOT NULL,
    "status" "StatusInscricaoIndividual" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campeonatoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "participanteId" INTEGER,

    CONSTRAINT "InscricaoIndividual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoIndividual_campeonatoId_usuarioId_key" ON "InscricaoIndividual"("campeonatoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "InscricaoIndividual" ADD CONSTRAINT "InscricaoIndividual_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoIndividual" ADD CONSTRAINT "InscricaoIndividual_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoIndividual" ADD CONSTRAINT "InscricaoIndividual_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
