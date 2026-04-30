-- CreateEnum
CREATE TYPE "StatusAnaliseInscricaoIndividual" AS ENUM ('AGUARDANDO_ANALISE', 'APROVADA', 'REPROVADA');

-- CreateEnum
CREATE TYPE "TamanhoCamisa" AS ENUM ('P', 'M', 'G', 'GG');

-- AlterTable
ALTER TABLE "InscricaoIndividual" ADD COLUMN     "analisadoEm" TIMESTAMP(3),
ADD COLUMN     "comprovantePagamento" TEXT,
ADD COLUMN     "observacaoAdmin" TEXT,
ADD COLUMN     "statusAnalise" "StatusAnaliseInscricaoIndividual" NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
ADD COLUMN     "tamanhoCamisa" "TamanhoCamisa",
ADD COLUMN     "valorTotalCentavos" INTEGER NOT NULL DEFAULT 2000;

-- CreateIndex
CREATE INDEX "InscricaoIndividual_campeonatoId_statusAnalise_idx" ON "InscricaoIndividual"("campeonatoId", "statusAnalise");

-- CreateIndex
CREATE INDEX "InscricaoIndividual_campeonatoId_status_idx" ON "InscricaoIndividual"("campeonatoId", "status");
