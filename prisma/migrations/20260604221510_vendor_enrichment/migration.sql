-- AlterTable
ALTER TABLE "VendorAnalysis" ADD COLUMN "hiddenDependencies" JSONB;
ALTER TABLE "VendorAnalysis" ADD COLUMN "maturityJustification" TEXT;
ALTER TABLE "VendorAnalysis" ADD COLUMN "maturityScore" INTEGER;
ALTER TABLE "VendorAnalysis" ADD COLUMN "relevance" TEXT;
ALTER TABLE "VendorAnalysis" ADD COLUMN "solutionSummary" TEXT;
