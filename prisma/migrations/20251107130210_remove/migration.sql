/*
  Warnings:

  - You are about to drop the column `createdAt` on the `KeywordGroup` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `KeywordGroup` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `KeywordGroup` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "KeywordGroup_slug_idx";

-- DropIndex
DROP INDEX "KeywordGroup_slug_key";

-- AlterTable
ALTER TABLE "KeywordGroup" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "slug";
