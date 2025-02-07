/*
  Warnings:

  - You are about to drop the column `rootFolderId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `rootFolderId` on the `Folder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_rootFolderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_rootFolderId_fkey";

-- AlterTable
ALTER TABLE "public"."File" DROP COLUMN "rootFolderId";

-- AlterTable
ALTER TABLE "public"."Folder" DROP COLUMN "rootFolderId";
