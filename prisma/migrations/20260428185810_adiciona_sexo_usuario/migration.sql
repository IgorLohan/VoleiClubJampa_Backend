-- CreateEnum
CREATE TYPE "SexoUsuario" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_INFORMAR');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "sexo" "SexoUsuario";
