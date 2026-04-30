/*
  Warnings:

  - You are about to drop the column `organizadorId` on the `Campeonato` table. All the data in the column will be lost.
  - You are about to drop the `Organizador` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Campeonato" DROP CONSTRAINT "Campeonato_organizadorId_fkey";

-- AlterTable
ALTER TABLE "Campeonato" DROP COLUMN "organizadorId";

-- DropTable
DROP TABLE "Organizador";
