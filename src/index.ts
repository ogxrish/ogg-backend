
import dotenv from "dotenv";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import { collect as collectOgg, repurchaseOgg, uniqueWallets } from "./ogg";
import { collect as collectOgc, collectDailyOgcData, repurchaseOgc, test } from "./ogc";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { collectDailyOgfData, collectOgfLeaderboard, repurchaseOgf } from "./ogf";

const app = express();
app.use(cors());

dotenv.config();
export const prisma = new PrismaClient();
app.get("/data", async (req, res) => {
    try {
        let { start, end }: any = req.query;
        const incremental = (await prisma.incrementalDataStep.findMany()).map((data) => {
            return {
                id: data.id,
                reward: data.reward.toString(),
                totalMiners: data.totalMiners.toString(),
                unclaimedOgg: data.unclaimedOgg.toString(),
                purchasedOgg: data.purchasedOgg.toString(),
            };
        });
        const single: any = await prisma.globalData.findUnique({ where: { id: 0 } });
        single.uniqueWallets = single.uniqueWallets.toString();
        if (start === undefined || end === undefined) {
            return res.status(200).json({ incremental, single });
        } else {
            start = Number(start);
            end = Number(end);
            return res.status(200).json({ incremental: incremental.slice(start, end), single });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).send("Internal server error");
    }
});
app.get("/ogc-data", async (req, res) => {
    try {
        let incremental = await prisma.incrementalDataStepOgc.findMany();
        incremental = incremental.sort((i1, i2) => i1.id - i2.id);
        incremental = incremental.slice(Math.max(0, incremental.length - 250), incremental.length);
        const global = await prisma.ogcGlobalData.findUnique({ where: { id: 0 } });
        const leaderboard = await prisma.topClaimedOgc.findMany();
        return res.status(200).json({
            incremental,
            leaderboard,
            totalLocked: global?.totalLocked || "0",
            totalUnlockable: global?.totalUnlockable || "0",
            lastWinningReserves: global?.lastWinningReserves || []
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
})
app.get("/ogf-data", async (req, res) => {
    try {
        const data = await prisma.ogfDailyData.findMany({
            orderBy: { id: "asc" },
            take: 200
        });
        const leaderboard = await prisma.topClaimedOgf.findMany({
            orderBy: { claimed: "desc" },
            take: 10,
        })
        return res.status(200).json({ data, leaderboard })
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
})
async function main() {
    // await test();
}
main().then(() => console.log("DONE"));
work();
async function work() {
    try {
        await repurchaseOgc();
    } catch (e) {
        console.error(e);
        console.error("Error repurchasing ogc")
    }
    try {
        await repurchaseOgg();
    } catch (e) {
        console.error(e);
        console.error("Error repurchasing ogg")
    }
    try {
        await repurchaseOgf()
    } catch (e) {
        console.error(e)
        console.error("Error repurchasing ogf")
    }
    schedule(work);
}
const MIN_INTERVAL = 1000 * 1000; // in ms
const MAX_INTERVAL = 5000 * 1000; // ms
export function schedule(f: () => any) {
    const randomInterval = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    console.log(`Next run in ${randomInterval / 1000} seconds`);
    setTimeout(f, randomInterval);
}
cron.schedule('50 23 * * *', async () => {
    try {
        await uniqueWallets();
    } catch (e) {
        console.error(e);
        console.error("Failed to get unique wallets");
    }
}, { timezone: "UTC" });

cron.schedule("*/15 * * * *", async () => {
    try {
        await collectOgc();
    } catch (e) {
        console.error(e);
        console.error("Error collecting ogc leaderboard")
    }
}, { timezone: "UTC" })

cron.schedule("*/15 * * * *", async () => {
    try {
        await collectOgfLeaderboard();
    } catch (e) {
        console.error(e);
        console.error("Error collecting ogf leaderboard")
    }
}, { timezone: "UTC" })

cron.schedule('0 1 * * *', async () => {
    try {
        await collectOgg();
        await collectDailyOgcData();
    } catch (e) {
        console.error(e);
        console.error("Failed to collect data");
    }
}, { timezone: "UTC" });

cron.schedule('0 1 * * * ', async () => {
    try {
        await collectDailyOgfData()
    } catch (e) {
        console.error(e)
        console.error("Failed to collect ogf data")
    }
}, { timezone: "UTC" })

app.listen(process.env.PORT || 3001, async () => {
    console.log(`Server listening on ${process.env.PORT || 3001}`);
});












