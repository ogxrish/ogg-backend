import { BN, Program } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { transactionSenderAndConfirmationWaiter } from "./transaction";
import dotenv from "dotenv";
import { prisma } from ".";
import fs from "fs";

dotenv.config();

export const TOKEN_ADDRESS = process.env.NETWORK === "devnet" ? new PublicKey("3TAHeRZ9pkiUU5GbPfxEJAEXhM4ARmMZTqvRdWooU54M") : new PublicKey("5gJg5ci3T7Kn5DLW4AQButdacHJtvADp7jJfNsLbRc1k");
const TOKEN_DECIMALS = 9;
export async function transferSol(from: Keypair, to: Keypair, amount: number) {
    const connection = new Connection(process.env.RPC_URL!);
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: amount,
        })
    );
    const recentBlockhash = await connection.getLatestBlockhash();
    tx.feePayer = from.publicKey
    tx.recentBlockhash = recentBlockhash.blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [from], {
        commitment: "confirmed",
        minContextSlot: undefined,
    });
    console.log(`Transfer transaction: ${sig}`);
}
export async function withdrawSolTransaction(program: Program, wallet: Keypair) {
    return await program.methods.withdrawFees().accounts({
        signer: wallet.publicKey,
    }).rpc();
}
export async function withdrawSolTransactionOgc(program: Program, wallet: Keypair) {
    return await program.methods.withdrawSol().accounts({
        signer: wallet.publicKey
    }).rpc();
}
export async function depositOgcTransaction(program: Program, wallet: Keypair, tokenAddress: string) {
    const connection = new Connection(process.env.RPC_URL!);
    const address = new PublicKey(tokenAddress);
    const signerTokenAccount = getAssociatedTokenAddressSync(address, wallet.publicKey);
    const account = await getAccount(connection, signerTokenAccount);
    return await program.methods.depositOgc(new BN(account.amount.toString())).accounts({
        signer: wallet.publicKey,
        signerTokenAccount,
    }).rpc();
}

export async function setProgramOggBalance(program: Program, wallet: Keypair, balance: number, connection: Connection) {
    const signerTokenAccount = getAssociatedTokenAddressSync(TOKEN_ADDRESS, wallet.publicKey);
    const targetBalance = new BN(balance).mul(new BN(10 ** TOKEN_DECIMALS));
    const [account] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_account")],
        program.programId
    );
    const currentBalance = new BN((await getAccount(connection, account)).amount.toString());
    return await program.methods.withdrawProgramToken(currentBalance.sub(targetBalance)).accounts({
        signer: wallet.publicKey,
        signerTokenAccount,
    }).rpc();
}
export async function depositOggTransaction(program: Program, wallet: Keypair) {
    const connection = new Connection(process.env.RPC_URL!);
    const signerTokenAccount = getAssociatedTokenAddressSync(TOKEN_ADDRESS, wallet.publicKey);
    const account = await getAccount(connection, signerTokenAccount);
    if (account.amount > 0) {
        console.log(`Depositing ${(account.amount / BigInt(10 ** TOKEN_DECIMALS)).toString()} $OGG`);
        return await program.methods.fundProgramToken(new BN(account.amount.toString())).accounts({
            signer: wallet.publicKey,
            signerTokenAccount,
        }).rpc();
    }
}

const SOL = "So11111111111111111111111111111111111111112";
export async function swapTransaction(wallet: Keypair, connection: Connection, inAmount: number, tokenAddress: string) {
    const quoteResponse = await (
        await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${SOL}&outputMint=${tokenAddress}&amount=${inAmount}&slippageBps=50`)
    ).json();
    const { swapTransaction } = await (
        await fetch('https://lite-api.jup.ag/swap/v1/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: true,
            })
        })
    ).json();
    if (!swapTransaction) {
        console.log("Could not find route for coin: ", tokenAddress)
        console.log(`QuoteResponse: ${quoteResponse}`)
        return
    }
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    // sign the transaction
    transaction.sign([wallet]);
    const latestBlockHash = await connection.getLatestBlockhash();

    // Execute the transaction
    const rawTransaction = transaction.serialize();
    // const txid = await connection.sendRawTransaction(rawTransaction, {
    //     skipPreflight: true,
    //     maxRetries: 2
    // });
    console.log(`Swapping ${quoteResponse.inAmount / LAMPORTS_PER_SOL} SOL for ${quoteResponse.outAmount / 10 ** 9} OGG`);
    return {
        outAmount: quoteResponse.outAmount,
        tx: await transactionSenderAndConfirmationWaiter(
            {
                connection,
                serializedTransaction: rawTransaction,
                blockhashWithExpiryBlockHeight: latestBlockHash
            }
        )
    };
    // return await connection.confirmTransaction({
    //     blockhash: latestBlockHash.blockhash,
    //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //     signature: txid
    // });
}

export async function download() {
    const globalData = await prisma.globalData.findMany();
    const ogcGlobalData = await prisma.ogcGlobalData.findMany();
    const topClaimedOgc = await prisma.topClaimedOgc.findMany();
    const incrementalDataStepOgc = await prisma.incrementalDataStepOgc.findMany();
    const incrementalDataStep = await prisma.incrementalDataStep.findMany();
    const streak = await prisma.streak.findMany();
    const json = {
        globalData,
        ogcGlobalData,
        topClaimedOgc,
        incrementalDataStep,
        incrementalDataStepOgc,
        streak,
    }
    fs.writeFileSync(`data-${Date.now()}.json`, JSON.stringify(json));
}

export async function upload(filename: string) {
    const data = fs.readFileSync(filename, "utf8");
    const json = JSON.parse(data);

    // Upload globalData
    if (json.globalData && Array.isArray(json.globalData)) {
        for (const item of json.globalData) {
            await prisma.globalData.upsert({
                where: { id: item.id }, // Assuming `id` is the unique identifier
                update: item,
                create: item,
            });
        }
    }

    // Upload ogcGlobalData
    if (json.ogcGlobalData && Array.isArray(json.ogcGlobalData)) {
        for (const item of json.ogcGlobalData) {
            await prisma.ogcGlobalData.upsert({
                where: { id: item.id },
                update: item,
                create: item,
            });
        }
    }

    // Upload topClaimedOgc
    if (json.topClaimedOgc && Array.isArray(json.topClaimedOgc)) {
        for (const item of json.topClaimedOgc) {
            await prisma.topClaimedOgc.upsert({
                where: { id: item.id },
                update: item,
                create: item,
            });
        }
    }

    // Upload incrementalDataStepOgc
    if (json.incrementalDataStepOgc && Array.isArray(json.incrementalDataStepOgc)) {
        for (const item of json.incrementalDataStepOgc) {
            await prisma.incrementalDataStepOgc.upsert({
                where: { id: item.id },
                update: item,
                create: item,
            });
        }
    }

    // Upload incrementalDataStep
    if (json.incrementalDataStep && Array.isArray(json.incrementalDataStep)) {
        for (const item of json.incrementalDataStep) {
            await prisma.incrementalDataStep.upsert({
                where: { id: item.id },
                update: item,
                create: item,
            });
        }
    }

    // Upload streak
    if (json.streak && Array.isArray(json.streak)) {
        for (const item of json.streak) {
            await prisma.streak.upsert({
                where: { wallet: item.wallet },
                update: item,
                create: item,
            });
        }
    }

    console.log("Data uploaded successfully!");
}

export async function generateFakeData(n: number) {
    await prisma.incrementalDataStep.deleteMany();
    let reward = BigInt(600000000) * BigInt(10 ** 9);
    let totalMiners = 105;
    let unclaimedOgg = BigInt(0);
    for (let i = 0; i < n; i++) {
        const repurchased = BigInt(Math.floor(60000 + Math.random() * 50000)) * BigInt(10 ** 9);
        reward -= (reward / BigInt(100)) + repurchased;
        totalMiners -= 3 - Math.trunc(Math.random() * 5);
        if (totalMiners <= 20) {
            totalMiners += Math.floor(Math.random() * 4)
        }
        if (i > 10) {
            let newValue = unclaimedOgg + BigInt(Math.round(-5000 + 15000 * Math.random()))
            unclaimedOgg = newValue < 0 ? BigInt(0) : newValue;
        }
        await prisma.incrementalDataStep.create({
            data: {
                id: i,
                reward,
                totalMiners: BigInt(totalMiners),
                purchasedOgg: repurchased,
                unclaimedOgg,
            }
        })
    }
}



