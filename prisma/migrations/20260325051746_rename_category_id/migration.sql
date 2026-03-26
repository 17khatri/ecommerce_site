/*
  Warnings:

  - You are about to drop the column `categoriesId` on the `products` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_categoriesId_fkey`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `categoriesId`,
    ADD COLUMN `categoryId` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
