/*
  Warnings:

  - A unique constraint covering the columns `[tmpId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `tmpId` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_tmpId_key` ON `User`(`tmpId`);
