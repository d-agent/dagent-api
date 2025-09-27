/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `walletAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "walletAddress_userId_key" ON "public"."walletAddress"("userId");
