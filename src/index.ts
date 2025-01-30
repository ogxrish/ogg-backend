
import dotenv from "dotenv";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import { work, collect as collectOgg, uniqueWallets } from "./ogg";
import { collect as collectOgc, collectDailyOgcData, repurchaseOgc } from "./ogc";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

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
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
    }
})
async function main() {
    // console.log(bs58.encode(Keypair.generate().secretKey));
}
main().then(() => console.log("DONE"));
work();
repurchaseOgc();
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

app.listen(process.env.PORT || 3001, async () => {
    console.log(`Server listening on ${process.env.PORT || 3001}`);
});












