/*
  Warnings:

  - Added the required column `type` to the `userMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userMedia" ADD COLUMN     "type" "MediaType" NOT NULL;
