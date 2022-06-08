/*
  Warnings:

  - Added the required column `creatorId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Room` ADD COLUMN `creatorId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
