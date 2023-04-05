import {Account} from "./account";
import * as anchor from "@project-serum/anchor";
import * as spl from '@solana/spl-token';


const ROUTER_PDA_SEED = "router";
const ESCROW_PDA_SEED = "escrow";


interface PDAParam {
    key: anchor.web3.PublicKey,
    bump: number
}

export class SwapAccount extends Account { 
    tokenMint: anchor.web3.PublicKey;

    constructor(
        tokenMint: anchor.web3.PublicKey,
        provider?: anchor.AnchorProvider, 
        deployer?: anchor.web3.Keypair
    ){
        super(provider, deployer);
        this.program = anchor.workspace.DemoSwapProgram;
        this.tokenMint = tokenMint
    }

    getRouterPDA = async(): Promise<PDAParam> => {
        const [pda, bump] = await anchor.web3.PublicKey
        .findProgramAddress(
            [
            anchor.utils.bytes.utf8.encode(ROUTER_PDA_SEED),
            this.tokenMint.toBuffer(),
            ],
            this.program.programId
        );

        return {
            key: pda,
            bump: bump
        }
    }

    getEscrowPDA = async(): Promise<PDAParam> => {
        const [pda, bump] = await anchor.web3.PublicKey
        .findProgramAddress(
            [
            anchor.utils.bytes.utf8.encode(ESCROW_PDA_SEED),
            this.tokenMint.toBuffer(),
            ],
            this.program.programId
        );

        return {
            key: pda,
            bump: bump
        }
    }

    initialize = async(
        initializer: anchor.web3.Keypair, 
        token_decimal: number
    ) => {
        let routerPDA = await this.getRouterPDA();
        let escrowPDA = await this.getEscrowPDA();
        console.log("routerPDA: ", this.program);
        return await this.program.methods.initialize(token_decimal).accounts({
            initializer: initializer.publicKey,
            tokenMint: this.tokenMint,
            router: routerPDA.key,
            escrow: escrowPDA.key,
        }).signers([initializer]).rpc();
    }


    swap = async(user: anchor.web3.Keypair, userTokenAccount: anchor.web3.PublicKey, amount: anchor.BN)=> {
        let routerPDA = await this.getRouterPDA();
        let escrowPDA = await this.getEscrowPDA();

        return await this.program.methods.swap(amount).accounts({
            user: user.publicKey,
            router: routerPDA.key,
            tokenMint: this.tokenMint, 
            escrow: escrowPDA.key, 
            userTokenAccount: userTokenAccount
        }).signers([user]).rpc();
    }

    withdrawSol = async(initializer: anchor.web3.Keypair)=> {
        let routerPDA = await this.getRouterPDA();

        return await this.program.methods.withdrawSol().accounts({
            initializer: initializer.publicKey,
            router: routerPDA.key
        }).signers([initializer]).rpc();
    }

    withdrawEscrow = async(initializer: anchor.web3.Keypair, initializer_token_account: anchor.web3.PublicKey) => {
        let routerPDA = await this.getRouterPDA();
        let escrowPDA = await this.getEscrowPDA();

        return await this.program.methods.withdrawEscrow().accounts({
            initializer: initializer.publicKey,
            router: routerPDA.key,
            escrow: escrowPDA.key,
            initializerTokenAccount: initializer_token_account
        }).signers([initializer]).rpc();
    }

}