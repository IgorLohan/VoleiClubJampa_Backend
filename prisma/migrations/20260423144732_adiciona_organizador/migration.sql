/*
  Warnings:

  - Added the required column `organizadorId` to the `Campeonato` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campeonato" ADD COLUMN     "organizadorId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Organizador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizador_email_key" ON "Organizador"("email");

-- AddForeignKey
ALTER TABLE "Campeonato" ADD CONSTRAINT "Campeonato_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "Organizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
