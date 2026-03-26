/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `products_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products_images` DROP COLUMN `deletedAt`,
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false;
