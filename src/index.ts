
import dotenv from "dotenv";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "./idl.json";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
dotenv.config();


const admin = Keypair.fromSecretKey(bs58.decode(process.env.WALLET!));


// need to write function to withdraw sol, withdraw ogg, and to buy ogg on raydium pool and then add it back

let program: Program;
function setup() {
    const connection = new Connection(process.env.RPC_URL!);
    const wallet = new Wallet(admin);
    const provider = new AnchorProvider(connection, wallet);
    program = new Program(idl as any, provider);
}

setup();


// at set time every day
// withdraw all possible sol from program
// send sol to creator fees account ???
// every random amount of time do this
// 2. swap sol to ogg
// 3. add ogg to pool


