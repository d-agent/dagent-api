/*
  Warnings:

  - You are about to drop the column `nonce` on the `account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "nonce";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "nonce" TEXT;
