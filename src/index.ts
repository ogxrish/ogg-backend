
import dotenv from "dotenv";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { AnchorProvider, Program, Provider, Wallet } from "@coral-xyz/anchor";
import { depositOggTransaction, swapTransaction, withdrawOggTransaction, withdrawSolTransaction } from "./utils";
const idl = require("./idl.json");

dotenv.config();

const admin = Keypair.fromSecretKey(bs58.decode(process.env.WALLET!));

const PERCENTAGE_TO_BUY: number = 5;
const CREATOR_FEE_PERCENT: number = 0;
let program: Program;
let provider: Provider;
async function work() {
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
        const amount = Math.floor(balance * PERCENTAGE_TO_BUY / 100);
        const creatorFee = amount * CREATOR_FEE_PERCENT / 100;
        const buyAmount = amount - creatorFee;
        await swapTransaction(wallet.payer, connection, buyAmount);
        console.log(`Confirmed swap`);
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

const MIN_INTERVAL = 1000 * 1000; // in ms
const MAX_INTERVAL = 5000 * 1000; // ms
function schedule() {
    const randomInterval = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    console.log(`Next run in ${randomInterval / 1000} seconds`);
    setTimeout(work, randomInterval);
}


// schedule();

work();






// at set time every day
// withdraw all possible sol from program
// send sol to creator fees account ???
// every random amount of time do this
// 2. swap sol to ogg
// 3. add ogg to account


