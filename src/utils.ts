import { BN, Program } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { transactionSenderAndConfirmationWaiter } from "./transaction";
import dotenv from "dotenv";

dotenv.config();

export const TOKEN_ADDRESS = process.env.NETWORK === "devnet" ? new PublicKey("3TAHeRZ9pkiUU5GbPfxEJAEXhM4ARmMZTqvRdWooU54M") : new PublicKey("5gJg5ci3T7Kn5DLW4AQButdacHJtvADp7jJfNsLbRc1k");
const TOKEN_DECIMALS = 9;
export async function withdrawSolTransaction(program: Program, wallet: Keypair) {
    return await program.methods.withdrawFees().accounts({
        signer: wallet.publicKey,
    }).rpc();
}

export async function withdrawOggTransaction(program: Program, wallet: Keypair, amount: number) {
    const signerTokenAccount = getAssociatedTokenAddressSync(TOKEN_ADDRESS, wallet.publicKey);
    const finalAmount = new BN(amount).mul(new BN(10 ** TOKEN_DECIMALS));
    return await program.methods.withdrawProgramToken(finalAmount).accounts({
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
export async function swapTransaction(wallet: Keypair, connection: Connection, inAmount: number) {
    const quoteResponse = await (
        await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL}&outputMint=${TOKEN_ADDRESS}&amount=${inAmount}&slippageBps=50`)
    ).json();
    const { swapTransaction } = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
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
    return await transactionSenderAndConfirmationWaiter(
        {
            connection,
            serializedTransaction: rawTransaction,
            blockhashWithExpiryBlockHeight: latestBlockHash
        }
    );
    // return await connection.confirmTransaction({
    //     blockhash: latestBlockHash.blockhash,
    //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //     signature: txid
    // });
}



