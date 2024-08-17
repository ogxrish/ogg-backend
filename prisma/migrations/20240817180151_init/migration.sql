-- CreateTable
CREATE TABLE "GlobalData" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "uniqueWallets" BIGINT NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GlobalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalDataStep" (
    "id" INTEGER NOT NULL,
    "reward" BIGINT NOT NULL,
    "totalMiners" BIGINT NOT NULL,
    "unclaimedOgg" BIGINT NOT NULL,
    "purchasedOgg" BIGINT NOT NULL,

    CONSTRAINT "IncrementalDataStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "wallet" TEXT NOT NULL,
    "length" INTEGER NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("wallet")
);

-- CreateIndex
CREATE INDEX "Streak_wallet_idx" ON "Streak"("wallet");
