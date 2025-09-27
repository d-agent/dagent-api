/*
  Warnings:

  - You are about to drop the column `agentCard` on the `agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."agent" DROP COLUMN "agentCard",
ADD COLUMN     "can_stream" BOOLEAN,
ADD COLUMN     "default_agent_name" TEXT,
ADD COLUMN     "framework_used" TEXT NOT NULL DEFAULT 'google_adk',
ADD COLUMN     "is_multiAgentSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[];
