import { Wallet, AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { prisma } from ".";
import { getAccount } from "@solana/spl-token";
const idl = require("./ogc_reserve.json");

dotenv.config();

const connection = new Connection(process.env.DEVNET_RPC_URL);
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.OGC_WALLET));
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
            unlockable = unlockable.add(lockAccount.account.amount);
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

    const rewardAmount = new BN(holderAccount.amount.toString()).mul(globalAccount.rewardPercent).div(new BN(100));
    const voteAccounts = await program.account.voteAccount.all([
        {
            memcmp: {
                offset: 8 + 32,
                bytes: globalAccount.epoch.toArrayLike(Buffer, "le", 8)
            }
        }
    ]);
    const globalData = await prisma.ogcGlobalData.findUnique({
        where: { id: 0 }
    });
    await prisma.incrementalDataStepOgc.create({
        data: {
            id: globalData.index + 1,
            dailyOgcReward: rewardAmount.toString(),
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