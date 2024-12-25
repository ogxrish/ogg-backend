
import dotenv from "dotenv";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import { work, uniqueWallets, collect as collectOgg } from "./ogg";
import { collect as collectOgc, collectDailyOgcData, repurchaseOgc, getVoteAccounts } from "./ogc";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { Wallet, AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { download, upload } from "./utils";
const idl_broken = require("./ogc_reserve_broken.json");
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
    // await download();
    // await upload("data-1735061097192.json");
    const accounts = await getVoteAccounts();
    console.log(accounts.length);
}
main().then(() => console.log("DONE"));
work();
repurchaseOgc();
// cron.schedule('50 23 * * *', async () => {
//     try {
//         await uniqueWallets();
//     } catch (e) {
//         console.error(e);
//         console.error("Failed to get unique wallets");
//     }
// }, { timezone: "UTC" });
cron.schedule("*/15 * * * *", async () => {
    try {
        await collectOgc();
    } catch (e) {
        console.error(e);
    }
})
cron.schedule('0 1 * * *', async () => {
    try {
        // await collectOgg();
        await collectDailyOgcData();
    } catch (e) {
        console.error(e);
        console.error("Failed to collect data");
    }
}, { timezone: "UTC" });

app.listen(process.env.PORT || 3001, async () => {
    console.log(`Server listening on ${process.env.PORT || 3001}`);
});

// run this later 
// solana program close Bwombv4YnhcWAo7QHkqMsbem3Y88YdDStk6yn6FnNHTX --bypass-warning --keypair /home/xeony/.config/solana/id.json --url devnet
// steps
// 1. run epochs
// 2. Open up unlock page on main site
// 3. users come in and unlock

// async function main() {
//     const ogcMint = new PublicKey("DH5JRsRyu3RJnxXYBiZUJcwQ9Fkb562ebwUsufpZhy45");
//     const admin = Keypair.fromSecretKey(bs58.decode(process.env.WALLET!));  
//     console.log(admin.publicKey.toString());
//     const connection = new Connection(process.env.RPC_URL!);
//     const wallet = new Wallet(admin);
//     const provider = new AnchorProvider(connection, wallet);
//     const program: any = new Program(idl_broken, provider);
//     const lockAccounts = await program.account.lockAccount.all();
//     console.log(lockAccounts.length);
//     const amount = await lockAccounts.reduce((prev: BN, curr: any) => {
//         return prev.add(curr.account.amount)
//     }, new BN(0))
//     console.log(amount.div(new BN(10 ** 9)).toString());
//     return;
//     const [globalAccountAddress] = PublicKey.findProgramAddressSync(
//         [Buffer.from("global")],
//         program.programId
//     );
//     const globalAccount = await program.account.globalDataAccount.fetch(globalAccountAddress);
//     // const signerTokenAccount = getAssociatedTokenAddressSync(ogcMint, admin.publicKey);
//     // const tx = await program.methods.modifyGlobalData(new BN(1), new BN(1), new BN(1)).accounts({
//     //     signer: admin.publicKey,
//     //     signerTokenAccount,
//     // }).rpc();
//     // console.log(tx);
//     // console.log(globalAccount);
//     let currentEpoch = globalAccount.epoch;
//     while (true) {
//         const [prevEpochAccount] = PublicKey.findProgramAddressSync(
//             [Buffer.from("epoch"), currentEpoch.toArrayLike(Buffer, "le", 8)],
//             program.programId
//         );
//         try {
//             currentEpoch = currentEpoch.add(new BN(1));
//             const tx = await program.methods.newEpoch(currentEpoch).accounts({
//                 signer: wallet,
//                 prevEpochAccount,
//             }).rpc();
//             console.log(`Incremented to epoch ${currentEpoch.toString()} in tx ${tx}`);
//         } catch (e) {
//             console.error(e);
//             currentEpoch = currentEpoch.sub(new BN(1))
//             console.log(currentEpoch.toString());
//         }
//         await new Promise(resolve => setTimeout(resolve, 3000));
//     }
// }
// main().then(() => console.log("DONE"));











