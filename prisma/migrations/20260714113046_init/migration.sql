-- CreateEnum
CREATE TYPE "VotingStatus" AS ENUM ('pending', 'in_progress', 'submitted');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorPrimary" TEXT,
    "colorAccent" TEXT,
    "logoUrl" TEXT,
    "votingOpensAt" TIMESTAMP(3),
    "votingClosesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_sessions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "VotingStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voting_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_selections" (
    "id" TEXT NOT NULL,
    "votingSessionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vote_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "categories_eventId_idx" ON "categories"("eventId");

-- CreateIndex
CREATE INDEX "candidates_categoryId_idx" ON "candidates"("categoryId");

-- CreateIndex
CREATE INDEX "participants_eventId_idx" ON "participants"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_eventId_email_key" ON "participants"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "voting_sessions_participantId_key" ON "voting_sessions"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "voting_sessions_token_key" ON "voting_sessions"("token");

-- CreateIndex
CREATE INDEX "voting_sessions_token_idx" ON "voting_sessions"("token");

-- CreateIndex
CREATE INDEX "vote_selections_votingSessionId_idx" ON "vote_selections"("votingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "vote_selections_votingSessionId_categoryId_key" ON "vote_selections"("votingSessionId", "categoryId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_sessions" ADD CONSTRAINT "voting_sessions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_selections" ADD CONSTRAINT "vote_selections_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "voting_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_selections" ADD CONSTRAINT "vote_selections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_selections" ADD CONSTRAINT "vote_selections_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
