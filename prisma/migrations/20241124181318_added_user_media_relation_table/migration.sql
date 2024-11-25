/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('ANIME', 'MOVIE', 'SHOW');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'DROPPED');

-- DropTable
DROP TABLE "Tag";

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "type" "MediaType" NOT NULL,
    "apiId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "genres" TEXT[],
    "image" TEXT NOT NULL,
    "meta" JSONB NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userMedia" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "progress" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userMedia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "userMedia" ADD CONSTRAINT "userMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userMedia" ADD CONSTRAINT "userMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
