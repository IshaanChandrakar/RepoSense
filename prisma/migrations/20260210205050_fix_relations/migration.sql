-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "installId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PullRequest_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "grade" TEXT,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_prId_fkey" FOREIGN KEY ("prId") REFERENCES "PullRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubId_key" ON "Repository"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_githubId_key" ON "PullRequest"("githubId");
