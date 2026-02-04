/*
  Warnings:

  - You are about to drop the column `totalRevenue` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `tvaAmount` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `tvaRate` on the `quotes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "totalRevenue",
ADD COLUMN     "last_interaction" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE',
ADD COLUMN     "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "ai_processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "direction" TEXT NOT NULL DEFAULT 'inbound',
ADD COLUMN     "entities" JSONB,
ADD COLUMN     "intent" TEXT,
ADD COLUMN     "media_type" TEXT,
ADD COLUMN     "media_url" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "tokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "urgency" TEXT;

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "tvaAmount",
DROP COLUMN "tvaRate",
ADD COLUMN     "estimated_duration" TEXT,
ADD COLUMN     "markup_percentage" DOUBLE PRECISION DEFAULT 30,
ADD COLUMN     "tva_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tva_rate" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
ADD COLUMN     "validity_days" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "conversation_summaries" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "last_intent" TEXT,
    "last_message_at" TIMESTAMP(3),
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_summaries_phone_number_key" ON "conversation_summaries"("phone_number");

-- CreateIndex
CREATE INDEX "conversation_summaries_phone_number_idx" ON "conversation_summaries"("phone_number");

-- CreateIndex
CREATE INDEX "messages_phone_number_idx" ON "messages"("phone_number");
