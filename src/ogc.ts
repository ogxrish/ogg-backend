import { Wallet, AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { getAccount } from "@solana/spl-token";
import { prisma } from ".";
import { depositOgcTransaction, swapTransaction, withdrawSolTransactionOgc } from "./utils";
const idl = require("./ogc_reserve.json");

dotenv.config();
const ogcAddress: string = "DH5JRsRyu3RJnxXYBiZUJcwQ9Fkb562ebwUsufpZhy45";
const PERCENTAGE_TO_BUY: number = 5;
const CREATOR_FEE_PERCENT: number = 0;
const connection = new Connection(process.env.RPC_URL);
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.WALLET));
const wallet = new Wallet(keypair);
const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
const program: any = new Program(idl, provider);
export async function collect() {
    const [globalAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId
    );
    const globalAccount = await program.account.globalDataAccount.fetch(globalAccountAddress);
    const lockAccounts = await program.account.lockAccount.all();
    let total = new BN(0);
    let unlockable = new BN(0);
    for (const lockAccount of lockAccounts) {
        if (lockAccount.account.unlockEpoch.lte(globalAccount.epoch)) {
            //unlockable = unlockable.add(lockAccount.account.amount);
        }
        total = total.add(lockAccount.account.amount);
    }
    await prisma.ogcGlobalData.upsert({
        create: {
            id: 0,
            totalLocked: total.toString(),
            totalUnlockable: total.toString(),
        },
        where: {
            id: 0
        },
        update: {
            totalLocked: total.toString(),
            totalUnlockable: total.toString()
        }
    });
    let userStatsAccounts = await program.account.userStatsAccount.all();
    userStatsAccounts = userStatsAccounts.sort((a: any, b: any) => {
        return b.account.amountClaimed.gte(a.account.amountClaimed) ? 1 : -1;
    });
    for (let i = 0; i < 10 && i < userStatsAccounts.length; i++) {
        await prisma.topClaimedOgc.upsert({
            where: {
                id: i
            },
            create: {
                id: i,
                wallet: userStatsAccounts[i].account.owner.toString(),
                claimed: userStatsAccounts[i].account.amountClaimed.toString(),
                active: userStatsAccounts[i].account.activeReserveEpochs.toString(),
            },
            update: {
                wallet: userStatsAccounts[i].account.owner.toString(),
                claimed: userStatsAccounts[i].account.amountClaimed.toString(),
                active: userStatsAccounts[i].account.activeReserveEpochs.toString(),
            }
        });
    }
}
export async function repurchaseOgc() {
    try {
        const balance = await connection.getBalance(keypair.publicKey);
        console.log(`Current balance of admin account: ${balance / LAMPORTS_PER_SOL}`);
        try {
            const tx = await withdrawSolTransactionOgc(program, keypair);
            console.log(`Withdraw tx: https://solscan.io/tx/${tx}`);
        } catch (e) {
            // console.error(e);
            console.log("No fees to withdraw");
        }
        if (balance < LAMPORTS_PER_SOL / 10) {
            throw new Error(`Balance of program account (${balance / LAMPORTS_PER_SOL}) is less than 0.1 SOL`);
        }
        const amount = Math.floor(balance * PERCENTAGE_TO_BUY / 100);
        const creatorFee = amount * CREATOR_FEE_PERCENT / 100;
        const buyAmount = amount - creatorFee;
        const { outAmount } = await swapTransaction(wallet.payer, connection, buyAmount, ogcAddress);
        console.log(`Confirmed swap at ${(new Date()).toString()}`);
        // link to view swaps: https://solscan.io/account/oggzGFTgRM61YmhEbgWeivVmQx8bSAdBvsPGqN3ZfxN#defiactivities
        const tx = await depositOgcTransaction(program, wallet.payer, ogcAddress);
        console.log(`Deposited ${outAmount.toString()} $OGC`);
        if (tx) {
            console.log(`Deposit ogc tx: https://solscan.io/tx/${tx}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        schedule();
    }
}
const MIN_INTERVAL = 1000 * 1000; // in ms
const MAX_INTERVAL = 5000 * 1000; // ms
export function schedule() {
    const randomInterval = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    console.log(`Next run in ${randomInterval / 1000} seconds`);
    setTimeout(repurchaseOgc, randomInterval);
}
export async function collectDailyOgcData() {
    const [globalAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId,
    );
    const [holderAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("holder")],
        program.programId
    );
    const globalAccount = await program.account.globalDataAccount.fetch(globalAccountAddress);
    const holderAccount = await getAccount(connection, holderAccountAddress);
    console.log(globalAccount);
    console.log(globalAccount.epoch.toString());
    const voteAccounts = await program.account.voteAccount.all([
        {
            memcmp: {
                offset: 40,
                bytes: bs58.encode(globalAccount.epoch.toArrayLike(Buffer, "le", 8))
            }
        }
    ]);
    const globalData = await prisma.ogcGlobalData.findUniqueOrThrow({
        where: { id: 0 }
    });
    await prisma.incrementalDataStepOgc.create({
        data: {
            id: globalData.index + 1,
            dailyOgcReward: globalAccount.rewardAmount.toString(),
            totalReserve: holderAccount.amount.toString(),
            totalReservers: voteAccounts.length.toString(),
            unlockableOgg: globalData.totalUnlockable,
            lockedOgg: globalData.totalLocked
        }
    })
    await prisma.ogcGlobalData.update({
        where: { id: 0 },
        data: { index: globalData.index + 1 }
    })
}