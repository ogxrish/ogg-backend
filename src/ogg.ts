import { AnchorProvider, BN, Program, Provider, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { PrismaClient } from "@prisma/client";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { withdrawSolTransaction, swapTransaction, depositOggTransaction, setProgramOggBalance } from "./utils";
import dotenv from "dotenv";
const idl = require("./idl.json");

dotenv.config();

const admin = Keypair.fromSecretKey(bs58.decode(process.env.OGG_WALLET!));
const oggAddress: string = "5gJg5ci3T7Kn5DLW4AQButdacHJtvADp7jJfNsLbRc1k";
const PERCENTAGE_TO_BUY: number = 5;
const CREATOR_FEE_PERCENT: number = 0;
let program: any;
let provider: Provider;
let oggBought: bigint = BigInt(0);
export async function work() {
    try {
        const connection = new Connection(process.env.RPC_URL!);
        const wallet = new Wallet(admin);
        provider = new AnchorProvider(connection, wallet);
        program = new Program(idl, provider);

        const balance = await connection.getBalance(admin.publicKey);
        console.log(`Current balance of admin account: ${balance / LAMPORTS_PER_SOL}`);
        try {
            const tx = await withdrawSolTransaction(program, admin);
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
        const { outAmount } = await swapTransaction(wallet.payer, connection, buyAmount, oggAddress);
        oggBought += BigInt(outAmount);
        console.log(`Confirmed swap at ${(new Date()).toString()}`);
        // link to view swaps: https://solscan.io/account/oggzGFTgRM61YmhEbgWeivVmQx8bSAdBvsPGqN3ZfxN#defiactivities
        const tx = await depositOggTransaction(program, wallet.payer);
        if (tx) {
            console.log(`Deposit ogg tx: https://solscan.io/tx/${tx}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        schedule();
    }
}
const prisma = new PrismaClient();
export async function setup() {
    await prisma.globalData.upsert({
        where: {
            id: 0
        },
        update: {},
        create: {},
    });
}
export async function uniqueWallets() {
    await setup();
    const connection = new Connection(process.env.RPC_URL!);
    const wallet = new Wallet(admin);
    provider = new AnchorProvider(connection, wallet);
    program = new Program(idl, provider);
    const [globalAccountDataAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId,
    );
    const globalDataAccount = await program.account.globalDataAccount.fetch(globalAccountDataAddress);

    const miners = await program.account.mineAccount.all([
        {
            memcmp: {
                offset: 8 + 32,
                bytes: bs58.encode(globalDataAccount.epoch.toArrayLike(Buffer, "le", 8))
            }
        }
    ]);
    const streaks = await prisma.streak.findMany();
    const globalData = await prisma.globalData.findUnique({ where: { id: 0 } });
    let max = globalData.longestStreak;
    for (const streak of streaks) {
        const pubkey = new PublicKey(streak.wallet);
        const index = miners.findIndex((miner: any) => miner.account.owner.equals(pubkey));
        if (index !== -1) {
            miners.splice(index, 1);
            await prisma.streak.update({
                where: {
                    wallet: streak.wallet,
                },
                data: {
                    length: streak.length + 1,
                }
            });
            if (streak.length + 1 > max) {
                max = streak.length + 1;
            }
        } else {
            await prisma.streak.update({
                where: {
                    wallet: streak.wallet
                },
                data: {
                    length: 0,
                }
            });
        }
    }
    if (miners.length > 0) {
        await prisma.streak.createMany({
            data: miners.map((miner: any) => {
                return {
                    wallet: miner.account.owner.toString(),
                    length: 0
                };
            })
        });
    }
    await prisma.globalData.update({
        where: { id: 0 },
        data: { longestStreak: max, uniqueWallets: streaks.length }
    });
}
export async function catchup() {
    const connection = new Connection(process.env.RPC_URL!);
    const wallet = new Wallet(admin);
    provider = new AnchorProvider(connection, wallet);
    program = new Program(idl, provider);
    const [globalAccountDataAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId,
    );
    const globalDataAccount = await program.account.globalDataAccount.fetch(globalAccountDataAddress);
    const currentEpoch = globalDataAccount.epoch.toNumber();
    for (let i = 0; i < currentEpoch; i++) {
        collect(i);
    }
}
export async function collect(epoch?: number) {
    const connection = new Connection(process.env.RPC_URL!);
    const wallet = new Wallet(admin);
    provider = new AnchorProvider(connection, wallet);
    program = new Program(idl, provider);
    const [globalAccountDataAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId,
    );
    const globalDataAccount = await program.account.globalDataAccount.fetch(globalAccountDataAddress);
    const prevEpoch = epoch ? new BN(epoch) : globalDataAccount.epoch.sub(new BN(1));
    const [currentEpochAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("epoch"), prevEpoch.toArrayLike(Buffer, "le", 8)],
        program.programId
    );
    const epochAccount = await program.account.epochAccount.fetch(currentEpochAccountAddress);
    const oldMineAccounts = await program.account.epochAccount.all([
        {
            memcmp: {
                offset: 8 + 32,
                bytes: bs58.encode(prevEpoch.sub(new BN(10)).toArrayLike(Buffer, "le", 8))
            }
        }
    ]);
    let oggMissed: bigint = BigInt(0);
    if (oldMineAccounts.length > 0) {
        const [oldEpochAccountAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from("epoch"), prevEpoch.sub(new BN(10)).toArrayLike(Buffer, "le", 8)],
            program.programId,
        );
        const oldEpochAccount = await program.account.epochAccount.fetch(oldEpochAccountAddress);
        oggMissed = BigInt(oldEpochAccount.reward.toString()) / BigInt(oldEpochAccount.totalMiners.toString()) * BigInt(oldMineAccounts.length);
    }
    console.log({
        id: prevEpoch.toNumber(),
        reward: BigInt(epochAccount.reward.toString()),
        totalMiners: BigInt(epochAccount.totalMiners.toString()),
        unclaimedOgg: oggMissed,
        purchasedOgg: oggBought
    })
    const data = await prisma.incrementalDataStep.create({
        data: {
            id: prevEpoch.toNumber(),
            reward: BigInt(epochAccount.reward.toString()),
            totalMiners: BigInt(epochAccount.totalMiners.toString()),
            unclaimedOgg: oggMissed,
            purchasedOgg: oggBought
        }
    });
    oggBought = BigInt(0);
    console.log({ IncrementalData: data });
}

const MIN_INTERVAL = 1000 * 1000; // in ms
const MAX_INTERVAL = 5000 * 1000; // ms
export function schedule() {
    const randomInterval = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    console.log(`Next run in ${randomInterval / 1000} seconds`);
    setTimeout(work, randomInterval);
}
export async function withdraw() {
    const connection = new Connection(process.env.RPC_URL!);
    const wallet = new Wallet(admin);
    provider = new AnchorProvider(connection, wallet);
    program = new Program(idl, provider);
    const tx = await setProgramOggBalance(program, wallet.payer, 600000000, connection);
    console.log(`https://solscan.io/tx/${tx}`);
}

