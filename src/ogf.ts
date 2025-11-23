import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor"
import { OgfLottery } from "../ogf/ogf_lottery"
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import { swapTransaction } from "./utils";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { prisma } from ".";
const idl = require("../ogf/ogf_lottery.json")

dotenv.config()
const ogfAddress: string = "EQyRaajDZLEEdSrU8Hws29LWjDJczGKB1CV6jrWcZJn9";
const ogfTokenDecimals: number = 6
const connection = new Connection(process.env.RPC_URL)
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.OGF_WALLET!))
const wallet = new Wallet(keypair)
const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
const program = new Program<OgfLottery>(idl, provider)
const MIN_BALANCE = 0.1 * LAMPORTS_PER_SOL;

// TODO: Deploy program so this works
program.addEventListener("claimEvent", async (data) => {
    await prisma.topClaimedOgf.upsert({
        where: { wallet: data.user.toString() },
        update: {
            claimed: { increment: Number(data.amount.divn(10 ** ogfTokenDecimals).toString()) }
        },
        create: {
            wallet: data.user.toString(),
            claimed: Number(data.amount.divn(10 ** ogfTokenDecimals).toString())
        }
    })
})
let depositAmount: BN = new BN(0)
export async function repurchaseOgf() {
    try {
        const tx = await program.methods.withdrawSol().accounts({
            signer: keypair.publicKey
        }).rpc()
        console.log(`Withdraw tx: https://solscan.io/tx/${tx}`);
    } catch (e) {
        console.error(e);
    }
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Current balance of admin account: ${balance / LAMPORTS_PER_SOL}`);
    if (balance < LAMPORTS_PER_SOL / 10) {
        throw new Error(`Balance of program account (${balance / LAMPORTS_PER_SOL}) is less than 0.1 SOL`);
    }
    const amount = balance - MIN_BALANCE;
    // const creatorFee = amount * CREATOR_FEE_PERCENT / 100;
    const buyAmount = amount //- creatorFee;
    const { outAmount } = await swapTransaction(wallet.payer, connection, buyAmount, ogfAddress);
    console.log(`Confirmed swap at ${(new Date()).toString()}`);
    const signerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(ogfAddress), keypair.publicKey);
    const account = await getAccount(connection, signerTokenAccount);
    const depositedAmount = new BN(account.amount.toString())
    depositAmount = depositAmount.add(depositedAmount)
    const tx = await program.methods.depositToken(depositedAmount).accounts({
        signer: keypair.publicKey,
        signerTokenAccount,
    }).rpc()
    console.log(`Deposited ${outAmount.toString()} $OGF`);
    if (tx) {
        console.log(`Deposit ogf tx: https://solscan.io/tx/${tx}`);
    }
}
let lastPool: { index: number, bids: number } = { index: -1, bids: 0 };
const DECREASE_FACTOR = 10 ** 6;
export async function collectDailyOgfData() {
    const [globalDataAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId
    )
    const globalDataAccount = await program.account.globalData.fetch(globalDataAccountAddress)
    const [currentPoolAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), new BN(globalDataAccount.pools).toArrayLike(Buffer, "le", 2)],
        program.programId
    )
    const [holderAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("token")],
        program.programId
    )
    const holderAccount = await getAccount(connection, holderAddress)
    const currentPool = await program.account.pool.fetch(currentPoolAddress)
    let totalBids: number
    if (currentPool.id === lastPool.index) {
        totalBids = currentPool.bids - lastPool.bids
    } else {
        totalBids = currentPool.bids
    }
    const totalPoolSize = Number(currentPool.balance.divn(10 ** ogfTokenDecimals).toString())
    const totalUnreleasedOgf = Number((holderAccount.amount / BigInt(10 ** ogfTokenDecimals)))
    const totalRepurchasedOgf = Number(depositAmount.divn(10 ** ogfTokenDecimals).toString())
    console.log({ totalBids, totalPoolSize, totalRepurchasedOgf, totalUnreleasedOgf })
    await prisma.ogfDailyData.create({
        data: {
            totalBids,
            totalPoolSize: totalPoolSize / DECREASE_FACTOR,
            totalUnreleasedOgf: totalUnreleasedOgf / DECREASE_FACTOR,
            totalRepurchasedOgf: totalRepurchasedOgf / DECREASE_FACTOR,
        }
    })
    lastPool = { index: currentPool.id, bids: currentPool.bids }
    depositAmount = new BN(0)
}
