/*
  Warnings:

  - Made the column `refreshToken` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `refreshToken` TEXT NOT NULL;
