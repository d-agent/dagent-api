-- CreateTable
CREATE TABLE "public"."agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "agentCost" TEXT NOT NULL,
    "deployedUrl" TEXT NOT NULL,
    "agentCard" JSONB NOT NULL,
    "llmProvider" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL,
    "availableToUse" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."agent" ADD CONSTRAINT "agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
