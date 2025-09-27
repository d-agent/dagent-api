/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `apikey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "apikey_name_key" ON "public"."apikey"("name");
