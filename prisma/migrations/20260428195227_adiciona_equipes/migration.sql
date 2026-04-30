-- CreateEnum
CREATE TYPE "PapelMembroEquipe" AS ENUM ('DONO', 'MEMBRO');

-- CreateEnum
CREATE TYPE "StatusConviteEquipe" AS ENUM ('PENDENTE', 'ACEITO', 'EXPIRADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Participante" ADD COLUMN     "equipeId" INTEGER;

-- CreateTable
CREATE TABLE "Equipe" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoParticipante" "TipoParticipante" NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donoId" INTEGER NOT NULL,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipeMembro" (
    "id" SERIAL NOT NULL,
    "papel" "PapelMembroEquipe" NOT NULL DEFAULT 'MEMBRO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipeId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "EquipeMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteEquipe" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusConviteEquipe" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),
    "equipeId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,

    CONSTRAINT "ConviteEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_donoId_nome_key" ON "Equipe"("donoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "EquipeMembro_equipeId_usuarioId_key" ON "EquipeMembro"("equipeId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteEquipe_token_key" ON "ConviteEquipe"("token");

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipeMembro" ADD CONSTRAINT "EquipeMembro_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipeMembro" ADD CONSTRAINT "EquipeMembro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteEquipe" ADD CONSTRAINT "ConviteEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteEquipe" ADD CONSTRAINT "ConviteEquipe_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
