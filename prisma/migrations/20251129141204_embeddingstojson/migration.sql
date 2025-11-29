/*
  Warnings:

  - The `embedding` column on the `agent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "agent" DROP COLUMN "embedding",
ADD COLUMN     "embedding" JSONB DEFAULT '[]';
