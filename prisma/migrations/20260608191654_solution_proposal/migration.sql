-- CreateTable
CREATE TABLE "SolutionProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolutionProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SolutionProposal_projectId_key" ON "SolutionProposal"("projectId");
