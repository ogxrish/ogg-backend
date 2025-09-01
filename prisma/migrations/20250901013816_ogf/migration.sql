-- CreateTable
CREATE TABLE "TopClaimedOgf" (
    "wallet" TEXT NOT NULL,
    "claimed" INTEGER NOT NULL DEFAULT 0,
    "timesBid" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TopClaimedOgf_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "OgfDailyData" (
    "id" SERIAL NOT NULL,
    "totalBids" INTEGER NOT NULL,
    "totalPoolSize" INTEGER NOT NULL,
    "totalUnreleasedOgf" INTEGER NOT NULL,
    "totalRepurchasedOgf" INTEGER NOT NULL,

    CONSTRAINT "OgfDailyData_pkey" PRIMARY KEY ("id")
);
