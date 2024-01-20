-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "tsm_system_rows";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "tsm_system_time";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('UNPUBLISHED', 'PENDING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Solution" AS ENUM ('STRING', 'ARRAY', 'OBJECT');

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 50,
    "creation_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modification_date" TIMESTAMP(3),

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enigma" (
    "id" SERIAL NOT NULL,
    "series_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "image" TEXT,
    "description" TEXT NOT NULL,
    "creation_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modification_date" TIMESTAMP(3),

    CONSTRAINT "Enigma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT NOT NULL,
    "published" "SeriesStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "creation_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modification_date" TIMESTAMP(3),

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "verify" BOOLEAN DEFAULT false,
    "last_connection" TIMESTAMP(3),
    "token" INTEGER DEFAULT 0,
    "token_deadline" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "creation_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modification_date" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "is_invalid" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AchievementCreator" (
    "achievement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "EnigmaContent" (
    "enigma_id" INTEGER NOT NULL,
    "development" TEXT NOT NULL,
    "production" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EnigmaCreator" (
    "enigma_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "EnigmaFinished" (
    "enigma_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completion_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnigmaSolution" (
    "enigma_id" INTEGER NOT NULL,
    "type" "Solution" NOT NULL DEFAULT 'STRING',
    "solution" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesCreator" (
    "series_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesEnigmaOrder" (
    "series_id" INTEGER NOT NULL,
    "enigma_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesFinished" (
    "series_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completion_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SeriesVerifiedBy" (
    "series_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "verified_date" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "SeriesStarted" (
    "series_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "started_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocking_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserBlocked" (
    "user_id" INTEGER NOT NULL,
    "blocked_by" INTEGER NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserResetPassword" (
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserSeriesRating" (
    "user_id" INTEGER NOT NULL,
    "series_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 3
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "Achievement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Enigma_series_id_title_key" ON "Enigma"("series_id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Series_title_key" ON "Series"("title");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Token_user_id_token_key" ON "Token"("user_id", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementCreator_achievement_id_key" ON "AchievementCreator"("achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementCreator_achievement_id_user_id_key" ON "AchievementCreator"("achievement_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnigmaContent_enigma_id_key" ON "EnigmaContent"("enigma_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnigmaCreator_enigma_id_user_id_key" ON "EnigmaCreator"("enigma_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnigmaFinished_enigma_id_user_id_key" ON "EnigmaFinished"("enigma_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnigmaSolution_enigma_id_key" ON "EnigmaSolution"("enigma_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesCreator_series_id_user_id_key" ON "SeriesCreator"("series_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesEnigmaOrder_series_id_enigma_id_key" ON "SeriesEnigmaOrder"("series_id", "enigma_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesFinished_series_id_user_id_key" ON "SeriesFinished"("series_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesVerifiedBy_series_id_user_id_key" ON "SeriesVerifiedBy"("series_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesStarted_series_id_user_id_key" ON "SeriesStarted"("series_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_user_id_achievement_id_key" ON "UserAchievement"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlocked_user_id_key" ON "UserBlocked"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlocked_blocked_by_key" ON "UserBlocked"("blocked_by");

-- CreateIndex
CREATE UNIQUE INDEX "UserResetPassword_user_id_token_key" ON "UserResetPassword"("user_id", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSeriesRating_user_id_series_id_key" ON "UserSeriesRating"("user_id", "series_id");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementCreator" ADD CONSTRAINT "AchievementCreator_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementCreator" ADD CONSTRAINT "AchievementCreator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaContent" ADD CONSTRAINT "EnigmaContent_enigma_id_fkey" FOREIGN KEY ("enigma_id") REFERENCES "Enigma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaCreator" ADD CONSTRAINT "EnigmaCreator_enigma_id_fkey" FOREIGN KEY ("enigma_id") REFERENCES "Enigma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaCreator" ADD CONSTRAINT "EnigmaCreator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaFinished" ADD CONSTRAINT "EnigmaFinished_enigma_id_fkey" FOREIGN KEY ("enigma_id") REFERENCES "Enigma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaFinished" ADD CONSTRAINT "EnigmaFinished_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnigmaSolution" ADD CONSTRAINT "EnigmaSolution_enigma_id_fkey" FOREIGN KEY ("enigma_id") REFERENCES "Enigma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesCreator" ADD CONSTRAINT "SeriesCreator_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesCreator" ADD CONSTRAINT "SeriesCreator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesEnigmaOrder" ADD CONSTRAINT "SeriesEnigmaOrder_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesEnigmaOrder" ADD CONSTRAINT "SeriesEnigmaOrder_enigma_id_fkey" FOREIGN KEY ("enigma_id") REFERENCES "Enigma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesFinished" ADD CONSTRAINT "SeriesFinished_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesFinished" ADD CONSTRAINT "SeriesFinished_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesVerifiedBy" ADD CONSTRAINT "SeriesVerifiedBy_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesVerifiedBy" ADD CONSTRAINT "SeriesVerifiedBy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesStarted" ADD CONSTRAINT "SeriesStarted_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesStarted" ADD CONSTRAINT "SeriesStarted_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlocked" ADD CONSTRAINT "UserBlocked_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlocked" ADD CONSTRAINT "UserBlocked_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResetPassword" ADD CONSTRAINT "UserResetPassword_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeriesRating" ADD CONSTRAINT "UserSeriesRating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeriesRating" ADD CONSTRAINT "UserSeriesRating_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create first admin user
INSERT INTO "User" (name, email, password, avatar, role, verify, last_connection, creation_date, modification_date)
VALUES (
  'Nyphel',
  'nyphel@sybyl.in',
  'd1b07850f12048849c283a5ced0fcc5f4b73c4588c33744b0367a210cb7a439d2de158361a84105e5f82654aacca22f4c2f82075155410d6d0377b1a9f845cce.44757948c10119084cb91f915f0f70a3',
  null,
  'ADMINISTRATOR',
  true,
  null,
  '2024-01-17 13:59:54.381',
  '2024-01-17 14:02:25.234'
);
