/*
  Warnings:

  - A unique constraint covering the columns `[tokenVerificacaoEmail]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenVerificacaoEmail" TEXT,
ADD COLUMN     "tokenVerificacaoExpiraEm" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tokenVerificacaoEmail_key" ON "Usuario"("tokenVerificacaoEmail");
