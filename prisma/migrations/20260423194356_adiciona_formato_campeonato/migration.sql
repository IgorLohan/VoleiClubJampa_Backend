-- CreateEnum
CREATE TYPE "FormatoCampeonato" AS ENUM ('MATA_MATA', 'DUPLA_ELIMINACAO', 'TODOS_CONTRA_TODOS');

-- AlterTable
ALTER TABLE "Campeonato" ADD COLUMN     "formato" "FormatoCampeonato" NOT NULL DEFAULT 'MATA_MATA';
