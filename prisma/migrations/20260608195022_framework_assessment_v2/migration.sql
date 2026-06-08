-- CreateTable
CREATE TABLE "FrameworkAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "docAnalysis" JSONB,
    "questions" JSONB,
    "answers" JSONB,
    "scoring" JSONB,
    "report" TEXT,
    "decision" TEXT,
    "scoreGlobal" INTEGER,
    "pourcentage" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "llmProvider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FrameworkAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkAssessment_projectId_key" ON "FrameworkAssessment"("projectId");
