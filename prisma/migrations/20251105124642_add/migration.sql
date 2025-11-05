-- CreateTable
CREATE TABLE "KeywordGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KeywordGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordGroupKeyword" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "priority" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordGroupKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordGroup_slug_key" ON "KeywordGroup"("slug");

-- CreateIndex
CREATE INDEX "KeywordGroup_name_idx" ON "KeywordGroup"("name");

-- CreateIndex
CREATE INDEX "KeywordGroup_slug_idx" ON "KeywordGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordGroup_name_key" ON "KeywordGroup"("name");

-- CreateIndex
CREATE INDEX "KeywordGroupKeyword_keywordId_idx" ON "KeywordGroupKeyword"("keywordId");

-- CreateIndex
CREATE INDEX "KeywordGroupKeyword_groupId_idx" ON "KeywordGroupKeyword"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordGroupKeyword_keywordId_groupId_key" ON "KeywordGroupKeyword"("keywordId", "groupId");

-- AddForeignKey
ALTER TABLE "KeywordGroupKeyword" ADD CONSTRAINT "KeywordGroupKeyword_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordGroupKeyword" ADD CONSTRAINT "KeywordGroupKeyword_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "KeywordGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
