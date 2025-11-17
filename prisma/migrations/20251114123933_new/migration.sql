/*
  Warnings:

  - You are about to drop the column `groupId` on the `Keyword` table. All the data in the column will be lost.
  - You are about to drop the `_FileToKeyword` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_groupId_fkey";

-- DropForeignKey
ALTER TABLE "_FileToKeyword" DROP CONSTRAINT "_FileToKeyword_A_fkey";

-- DropForeignKey
ALTER TABLE "_FileToKeyword" DROP CONSTRAINT "_FileToKeyword_B_fkey";

-- AlterTable
ALTER TABLE "Keyword" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "_FileToKeyword";

-- CreateTable
CREATE TABLE "_FileKeywords" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileKeywords_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FileGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KeywordGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KeywordGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FileKeywords_B_index" ON "_FileKeywords"("B");

-- CreateIndex
CREATE INDEX "_FileGroups_B_index" ON "_FileGroups"("B");

-- CreateIndex
CREATE INDEX "_KeywordGroups_B_index" ON "_KeywordGroups"("B");

-- AddForeignKey
ALTER TABLE "_FileKeywords" ADD CONSTRAINT "_FileKeywords_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileKeywords" ADD CONSTRAINT "_FileKeywords_B_fkey" FOREIGN KEY ("B") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileGroups" ADD CONSTRAINT "_FileGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileGroups" ADD CONSTRAINT "_FileGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeywordGroups" ADD CONSTRAINT "_KeywordGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeywordGroups" ADD CONSTRAINT "_KeywordGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
