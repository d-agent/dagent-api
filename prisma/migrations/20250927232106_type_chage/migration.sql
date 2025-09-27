/*
  Warnings:

  - You are about to alter the column `remaining` on the `apikey` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."apikey" ALTER COLUMN "remaining" SET DATA TYPE INTEGER;
