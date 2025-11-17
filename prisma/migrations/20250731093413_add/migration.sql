/*
  Warnings:

  - Added the required column `name` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
