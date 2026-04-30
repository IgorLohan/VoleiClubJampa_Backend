-- AlterEnum
ALTER TYPE "FormatoCampeonato" ADD VALUE 'GRUPOS_3X4_REPESCAGEM';

-- AlterTable
ALTER TABLE "Jogo" ADD COLUMN     "grupo" TEXT,
ADD COLUMN     "ordem" INTEGER,
ADD COLUMN     "rodada" INTEGER;
