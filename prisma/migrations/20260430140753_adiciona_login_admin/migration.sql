/*
  Warnings:

  - A unique constraint covering the columns `[loginAdmin]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "loginAdmin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_loginAdmin_key" ON "Usuario"("loginAdmin");
