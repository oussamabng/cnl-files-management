/*
  Warnings:

  - You are about to drop the column `description` on the `KeywordGroup` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,parentId]` on the table `KeywordGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "KeywordGroup_name_key";

-- AlterTable
ALTER TABLE "KeywordGroup" DROP COLUMN "description",
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "KeywordGroup_name_parentId_key" ON "KeywordGroup"("name", "parentId");

-- AddForeignKey
ALTER TABLE "KeywordGroup" ADD CONSTRAINT "KeywordGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KeywordGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
