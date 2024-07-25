import { BN, Program } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";


const mint: PublicKey = process.env.NETWORK === "devnet" ? new PublicKey("EAaxwezvcFVP1sonNBQaCQNDsc924PiKMZaHNsbiiDu3") : new PublicKey("2sP9bY51NdqHGtHQfRduxUTnuPvugPAoPqtfrBR2VRCL");
const MIN_LAMPORTS = LAMPORTS_PER_SOL / 10;
export async function withdrawSolTransaction(program: Program, wallet: Keypair): Promise<Transaction | undefined> {
    const connection = new Connection(process.env.RPC_URL!);
    const [authority] = PublicKey.findProgramAddressSync(
        [Buffer.from("auth")],
        program.programId,
    );
    const amount = await connection.getBalance(authority);
    const toWithdraw = amount - MIN_LAMPORTS;
    if (toWithdraw > 0) {
        return await program.methods.withdrawFees(new BN(toWithdraw)).accounts({
            signer: wallet.publicKey,
        }).transaction();
    } else {
        console.log(`${amount} not enough to withdraw`);
    }
}

export async function withdrawOggTransaction(program: Program, wallet: Keypair): Promise<Transaction | undefined> {
    const connection = new Connection(process.env.RPC_URL!);
    const [tokenAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_account")],
        program.programId,
    );
    const tokenAccount = await getAccount(connection, tokenAddress);
    const signerTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
    if (tokenAccount.amount > 0) {
        return await program.methods.withdrawProgramToken(new BN(tokenAccount.amount.toString())).accounts({
            signer: wallet.publicKey,
            signerTokenAccount,
        }).transaction();
    }
}
export async function depositOggTransaction(program: Program, wallet: Keypair): Promise<Transaction | undefined> {
    const connection = new Connection(process.env.RPC_URL!);
    const signerTokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
    const account = await getAccount(connection, signerTokenAccount);
    if (account.amount > 0) {
        return await program.methods.depositOgg(new BN(account.amount.toString())).accounts({
            signer: wallet.publicKey,
            signerTokenAccount,
        }).transaction();
    }
}

export async function swapRaydiumTransaction(wallet: Keypair): Promise<Transaction | undefined> {
    return undefined;
}


