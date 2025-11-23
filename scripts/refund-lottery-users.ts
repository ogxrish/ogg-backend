import { Wallet, AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { OgfLottery } from "../ogf/ogf_lottery";
import dotenv from "dotenv";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
const idl = require("../ogf/ogf_lottery.json")
dotenv.config();

function bidIdToLamports(id: number, globalFee: number) {
    return globalFee * id ** 2;
}
const ogfAddress: string = "EQyRaajDZLEEdSrU8Hws29LWjDJczGKB1CV6jrWcZJn9";
async function main() {
    const connection = new Connection(process.env.RPC_URL)
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.OGG_WALLET!))
    const wallet = new Wallet(keypair)
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program<OgfLottery>(idl, provider)
    const globalDatas = await program.account.globalData.all();
    const globalData = globalDatas[0]
    const poolAccounts = await program.account.pool.all([
        {
            memcmp: {
                offset: 8,
                bytes: bs58.encode(new BN(globalData.account.pools).toArrayLike(Buffer, "le", 2))
            }
        }
    ])
    const poolAccount = poolAccounts[0];
    console.log(poolAccounts);
    const bidAccounts = await program.account.bidAccount.all([
        {
            memcmp: {
                offset: 8,
                bytes: bs58.encode(new BN(poolAccount.account.id).toArrayLike(Buffer, "le", 2))
            }
        }
    ])
    console.log(bidAccounts)
    let amountOwed: Map<string, number> = new Map();
    for (const bidAccount of bidAccounts) {
        const amount = bidIdToLamports(bidAccount.account.bidIds[0], globalData.account.fee.toNumber())
        const value = amountOwed.get(bidAccount.account.bidder.toString());
        if (value) {
            amountOwed.set(bidAccount.account.bidder.toString(), value + amount)
        } else {
            amountOwed.set(bidAccount.account.bidder.toString(), amount);
        }
    }
    const [programFeeAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol")],
        program.programId
    )
    const programFeeAccount = await connection.getAccountInfo(programFeeAccountAddress);
    const [programOgfAccountAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("token")],
        program.programId
    )
    const tokenAccount = await getAccount(connection, programOgfAccountAddress);
    // const signerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(ogfAddress), keypair.publicKey);
    // await program.methods.withdrawToken(new BN(tokenAccount.amount)).accounts({
    //     signer: keypair.publicKey,
    //     signerTokenAccount,
    // }).signers([keypair]).rpc()
    const adminAccount = await connection.getAccountInfo(keypair.publicKey);
    const sortedLeastToGreatest = Array.from(amountOwed).sort((a, b) => a[1] - b[1]);
    // for (const [key, amount] of sortedLeastToGreatest) {
    //     const ix = SystemProgram.transfer({
    //         fromPubkey: keypair.publicKey,
    //         toPubkey: new PublicKey(key),
    //         lamports: Math.min(amount, 60000000)
    //     })
    //     const tx = new Transaction().add(ix);
    //     await sendAndConfirmTransaction(
    //         connection,
    //         tx,
    //         [keypair]
    //     );
    // }
    console.log({ tokenBalance: tokenAccount.amount, programBalance: programFeeAccount.lamports, accountBalance: adminAccount.lamports, amountOwed: sortedLeastToGreatest });
}

main()