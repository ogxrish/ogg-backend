-- CreateTable
CREATE TABLE "GlobalData" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "uniqueWallets" BIGINT NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GlobalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgcGlobalData" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "index" INTEGER NOT NULL DEFAULT 0,
    "totalLocked" TEXT NOT NULL DEFAULT '',
    "totalUnlockable" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OgcGlobalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopClaimedOgc" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "wallet" TEXT NOT NULL,
    "active" TEXT NOT NULL,
    "claimed" TEXT NOT NULL,

    CONSTRAINT "TopClaimedOgc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalDataStepOgc" (
    "id" INTEGER NOT NULL,
    "dailyOgcReward" TEXT NOT NULL,
    "totalReserve" TEXT NOT NULL,
    "totalReservers" TEXT NOT NULL,
    "unlockableOgg" TEXT NOT NULL,
    "lockedOgg" TEXT NOT NULL,

    CONSTRAINT "IncrementalDataStepOgc_pkey" PRIMARY KEY ("id")
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
