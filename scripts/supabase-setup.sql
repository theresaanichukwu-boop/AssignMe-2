-- AssignMe Supabase setup: schema (2 migrations) + seed. Idempotent: safe to re-run.
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "WorkTypeKey" AS ENUM ('SEMINAR', 'RESEARCH_PROJECT', 'LITERATURE_REVIEW', 'CASE_STUDY', 'ESSAY', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "CitationStyle" AS ENUM ('APA_7', 'MLA_9', 'CHICAGO', 'HARVARD', 'VANCOUVER', 'IEEE');

-- CreateEnum
CREATE TYPE "AIMode" AS ENUM ('BUILD_WITH_ME', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "AIStatus" AS ENUM ('DRAFT', 'VERIFIED', 'NEEDS_REVIEW', 'BLOCKED', 'ERROR');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MODERATE', 'MINOR', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "SourceVerification" AS ENUM ('UNVERIFIED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinePack" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "terminology" JSONB NOT NULL DEFAULT '{}',
    "conventions" JSONB NOT NULL DEFAULT '{}',
    "structures" JSONB NOT NULL DEFAULT '{}',
    "methodologies" JSONB NOT NULL DEFAULT '[]',
    "frameworks" JSONB NOT NULL DEFAULT '[]',
    "evidencePrefs" JSONB NOT NULL DEFAULT '{}',
    "commonErrors" JSONB NOT NULL DEFAULT '[]',
    "reviewRules" JSONB NOT NULL DEFAULT '[]',
    "writingNotes" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTypeTemplate" (
    "id" TEXT NOT NULL,
    "key" "WorkTypeKey" NOT NULL,
    "name" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "guidance" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institution" TEXT,
    "faculty" TEXT,
    "department" TEXT,
    "programme" TEXT,
    "academicLevel" TEXT,
    "course" TEXT,
    "discipline" TEXT,
    "country" TEXT,
    "citationStyle" "CitationStyle" NOT NULL DEFAULT 'APA_7',
    "supervisor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workType" "WorkTypeKey" NOT NULL,
    "discipline" TEXT,
    "academicLevel" TEXT,
    "course" TEXT,
    "topic" TEXT NOT NULL,
    "objectives" JSONB NOT NULL DEFAULT '[]',
    "researchQuestions" JSONB NOT NULL DEFAULT '[]',
    "hypotheses" JSONB NOT NULL DEFAULT '[]',
    "citationStyle" "CitationStyle" NOT NULL DEFAULT 'APA_7',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exportHistory" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceRequirement" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileId" TEXT,
    "textExcerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionVersion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" JSONB NOT NULL DEFAULT '[]',
    "year" INTEGER,
    "publication" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "normalizedUrl" TEXT,
    "abstract" TEXT,
    "sourceType" TEXT,
    "verification" "SourceVerification" NOT NULL DEFAULT 'UNVERIFIED',
    "retrievalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "verification" "SourceVerification" NOT NULL DEFAULT 'UNVERIFIED',
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT,
    "objective" TEXT,
    "question" TEXT,
    "keyFinding" TEXT NOT NULL,
    "evidenceType" TEXT,
    "relevance" TEXT,
    "limitations" TEXT,
    "citationText" TEXT,
    "studentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT,
    "style" "CitationStyle" NOT NULL,
    "formatted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "mode" "AIMode" NOT NULL DEFAULT 'BUILD_WITH_ME',
    "task" TEXT NOT NULL,
    "contextHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "AIStatus" NOT NULL DEFAULT 'DRAFT',
    "answer" TEXT NOT NULL,
    "rationale" TEXT,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "citations" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "nextStep" TEXT,
    "reviewIssues" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sectionId" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewIssue" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "dimension" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limits" JSONB NOT NULL,
    "priceKobo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paystackReference" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "raw" JSONB NOT NULL DEFAULT '{}',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileObject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

-- CreateIndex
CREATE INDEX "Programme_institutionId_idx" ON "Programme"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_name_key" ON "Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinePack_disciplineId_key" ON "DisciplinePack"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTypeTemplate_key_key" ON "WorkTypeTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "Workspace_userId_createdAt_idx" ON "Workspace"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceRequirement_workspaceId_idx" ON "WorkspaceRequirement"("workspaceId");

-- CreateIndex
CREATE INDEX "Section_workspaceId_order_idx" ON "Section"("workspaceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Section_workspaceId_key_key" ON "Section"("workspaceId", "key");

-- CreateIndex
CREATE INDEX "SectionVersion_workspaceId_createdAt_idx" ON "SectionVersion"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SectionVersion_sectionId_version_key" ON "SectionVersion"("sectionId", "version");

-- CreateIndex
CREATE INDEX "Note_workspaceId_idx" ON "Note"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_doi_key" ON "Source"("doi");

-- CreateIndex
CREATE UNIQUE INDEX "Source_normalizedUrl_key" ON "Source"("normalizedUrl");

-- CreateIndex
CREATE INDEX "Source_year_idx" ON "Source"("year");

-- CreateIndex
CREATE INDEX "WorkspaceSource_workspaceId_idx" ON "WorkspaceSource"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSource_workspaceId_sourceId_key" ON "WorkspaceSource"("workspaceId", "sourceId");

-- CreateIndex
CREATE INDEX "EvidenceItem_workspaceId_idx" ON "EvidenceItem"("workspaceId");

-- CreateIndex
CREATE INDEX "Citation_workspaceId_idx" ON "Citation"("workspaceId");

-- CreateIndex
CREATE INDEX "AIRequest_workspaceId_createdAt_idx" ON "AIRequest"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_workspaceId_createdAt_idx" ON "Review"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewIssue_reviewId_severity_idx" ON "ReviewIssue"("reviewId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Trial_userId_active_idx" ON "Trial"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_paystackReference_key" ON "PaymentTransaction"("paystackReference");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_type_createdAt_idx" ON "UsageEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileObject_r2Key_key" ON "FileObject"("r2Key");

-- CreateIndex
CREATE INDEX "FileObject_userId_idx" ON "FileObject"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "AuditLog_userId_action_createdAt_idx" ON "AuditLog"("userId", "action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureConfiguration_key_key" ON "FeatureConfiguration"("key");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinePack" ADD CONSTRAINT "DisciplinePack_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceRequirement" ADD CONSTRAINT "WorkspaceRequirement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceRequirement" ADD CONSTRAINT "WorkspaceRequirement_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionVersion" ADD CONSTRAINT "SectionVersion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionVersion" ADD CONSTRAINT "SectionVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSource" ADD CONSTRAINT "WorkspaceSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSource" ADD CONSTRAINT "WorkspaceSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponse" ADD CONSTRAINT "AIResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AIRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewIssue" ADD CONSTRAINT "ReviewIssue_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "instructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceYearFrom" INTEGER,
ADD COLUMN     "sourceYearTo" INTEGER;

-- Seed data (mirrors prisma/seed.ts; ON CONFLICT = upsert).
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'ASSIGNMENT', 'Assignment', '{"stages":["parse-question","scope","structure","draft","review"],"commandWords":["Define","Explain","Discuss","Compare","Analyse","Evaluate","Critically evaluate","Examine","Justify"],"sections":["Introduction","Main answer","Conclusion","References"]}'::jsonb, '{"note":"Identify command words, scope, concepts, evidence requirements, and expected answer structure."}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'ESSAY', 'Essay', '{"sections":["Introduction","Thesis/central argument","Main discussion","Evidence and analysis","Counterargument","Conclusion","References"]}'::jsonb, '{}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'SEMINAR', 'Seminar', '{"sections":["Introduction","Objectives","Background","Main discussion","Evidence","Conclusion","Recommendations","References"]}'::jsonb, '{"note":"Adapt to discipline and institutional requirements."}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'RESEARCH_PROJECT', 'Research Project', '{"sections":["Chapter One: Introduction","Chapter Two: Literature Review","Chapter Three: Methodology","Chapter Four: Results","Chapter Five: Discussion, Conclusion and Recommendations"]}'::jsonb, '{"note":"Chapter structure is configurable per institution and discipline."}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'LITERATURE_REVIEW', 'Literature Review', '{"sections":["Review question","Search strategy","Source selection","Thematic organization","Critical synthesis","Evidence comparison","Research gaps","Conclusion","References"]}'::jsonb, '{"note":"Synthesize evidence; do not merely summarize sources individually."}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "WorkTypeTemplate" ("id", "key", "name", "structure", "guidance", "version", "updatedAt") VALUES (gen_random_uuid(), 'CASE_STUDY', 'Case Study', '{"sections":["Case background","Problem/context","Evidence","Analysis","Relevant framework","Options","Evaluation","Recommendation","Conclusion","References"]}'::jsonb, '{"note":"Adapt structure to the discipline."}'::jsonb, 1, now()) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "structure" = EXCLUDED."structure", "guidance" = EXCLUDED."guidance";
INSERT INTO "Discipline" ("id", "name") VALUES (gen_random_uuid(), 'General') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "DisciplinePack" ("id", "disciplineId", "terminology", "conventions", "structures", "methodologies", "frameworks", "evidencePrefs", "commonErrors", "reviewRules", "writingNotes", "version", "updatedAt") SELECT gen_random_uuid(), "id", '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, 1, now() FROM "Discipline" WHERE "name" = 'General' ON CONFLICT ("disciplineId") DO UPDATE SET "terminology" = EXCLUDED."terminology", "conventions" = EXCLUDED."conventions", "structures" = EXCLUDED."structures", "methodologies" = EXCLUDED."methodologies", "frameworks" = EXCLUDED."frameworks", "evidencePrefs" = EXCLUDED."evidencePrefs", "commonErrors" = EXCLUDED."commonErrors", "reviewRules" = EXCLUDED."reviewRules", "writingNotes" = EXCLUDED."writingNotes";
INSERT INTO "Discipline" ("id", "name") VALUES (gen_random_uuid(), 'Nursing') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "DisciplinePack" ("id", "disciplineId", "terminology", "conventions", "structures", "methodologies", "frameworks", "evidencePrefs", "commonErrors", "reviewRules", "writingNotes", "version", "updatedAt") SELECT gen_random_uuid(), "id", '{}'::jsonb, '{"style":"APA 7"}'::jsonb, '{}'::jsonb, '["Quantitative","Qualitative","Mixed methods"]'::jsonb, '[]'::jsonb, '{"recencyYears":5}'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, 1, now() FROM "Discipline" WHERE "name" = 'Nursing' ON CONFLICT ("disciplineId") DO UPDATE SET "terminology" = EXCLUDED."terminology", "conventions" = EXCLUDED."conventions", "structures" = EXCLUDED."structures", "methodologies" = EXCLUDED."methodologies", "frameworks" = EXCLUDED."frameworks", "evidencePrefs" = EXCLUDED."evidencePrefs", "commonErrors" = EXCLUDED."commonErrors", "reviewRules" = EXCLUDED."reviewRules", "writingNotes" = EXCLUDED."writingNotes";
INSERT INTO "Discipline" ("id", "name") VALUES (gen_random_uuid(), 'Computer Science') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "DisciplinePack" ("id", "disciplineId", "terminology", "conventions", "structures", "methodologies", "frameworks", "evidencePrefs", "commonErrors", "reviewRules", "writingNotes", "version", "updatedAt") SELECT gen_random_uuid(), "id", '{}'::jsonb, '{"style":"IEEE"}'::jsonb, '{}'::jsonb, '["Experimental","Design science"]'::jsonb, '[]'::jsonb, '{"recencyYears":5}'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, 1, now() FROM "Discipline" WHERE "name" = 'Computer Science' ON CONFLICT ("disciplineId") DO UPDATE SET "terminology" = EXCLUDED."terminology", "conventions" = EXCLUDED."conventions", "structures" = EXCLUDED."structures", "methodologies" = EXCLUDED."methodologies", "frameworks" = EXCLUDED."frameworks", "evidencePrefs" = EXCLUDED."evidencePrefs", "commonErrors" = EXCLUDED."commonErrors", "reviewRules" = EXCLUDED."reviewRules", "writingNotes" = EXCLUDED."writingNotes";
INSERT INTO "Discipline" ("id", "name") VALUES (gen_random_uuid(), 'Business Administration') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "DisciplinePack" ("id", "disciplineId", "terminology", "conventions", "structures", "methodologies", "frameworks", "evidencePrefs", "commonErrors", "reviewRules", "writingNotes", "version", "updatedAt") SELECT gen_random_uuid(), "id", '{}'::jsonb, '{"style":"Harvard"}'::jsonb, '{}'::jsonb, '["Case study","Survey"]'::jsonb, '["SWOT","PESTLE"]'::jsonb, '{"recencyYears":5}'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, 1, now() FROM "Discipline" WHERE "name" = 'Business Administration' ON CONFLICT ("disciplineId") DO UPDATE SET "terminology" = EXCLUDED."terminology", "conventions" = EXCLUDED."conventions", "structures" = EXCLUDED."structures", "methodologies" = EXCLUDED."methodologies", "frameworks" = EXCLUDED."frameworks", "evidencePrefs" = EXCLUDED."evidencePrefs", "commonErrors" = EXCLUDED."commonErrors", "reviewRules" = EXCLUDED."reviewRules", "writingNotes" = EXCLUDED."writingNotes";
INSERT INTO "Plan" ("id", "key", "name", "limits", "priceKobo") VALUES (gen_random_uuid(), 'FREE', 'Free', '{"aiGenerations":20,"researchSearches":10,"reviews":5,"workspaces":3,"exports":5,"storageMb":100}'::jsonb, 0) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "limits" = EXCLUDED."limits", "priceKobo" = EXCLUDED."priceKobo";
INSERT INTO "Plan" ("id", "key", "name", "limits", "priceKobo") VALUES (gen_random_uuid(), 'PREMIUM', 'Premium', '{"aiGenerations":500,"researchSearches":300,"reviews":200,"workspaces":50,"exports":200,"storageMb":5120}'::jsonb, 250000) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "limits" = EXCLUDED."limits", "priceKobo" = EXCLUDED."priceKobo";
INSERT INTO "Plan" ("id", "key", "name", "limits", "priceKobo") VALUES (gen_random_uuid(), 'TRIAL', 'One-month Premium Trial', '{"aiGenerations":100,"researchSearches":60,"reviews":40,"workspaces":10,"exports":40,"storageMb":1024}'::jsonb, 0) ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "limits" = EXCLUDED."limits", "priceKobo" = EXCLUDED."priceKobo";
INSERT INTO "FeatureConfiguration" ("id", "key", "value", "updatedAt") VALUES (gen_random_uuid(), 'usageLimits', '{"free":{"aiGenerations":20,"researchSearches":10,"reviews":5,"workspaces":3,"exports":5,"storageMb":100},"premium":{"aiGenerations":500,"researchSearches":300,"reviews":200,"workspaces":50,"exports":200,"storageMb":5120}}'::jsonb, now()) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";
