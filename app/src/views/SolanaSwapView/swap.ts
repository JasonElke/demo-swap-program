import * as anchor from "@project-serum/anchor";
import * as spl from '@solana/spl-token';
import {env} from "./data";
const tokenMint = new anchor.web3.PublicKey(env.swap_token);

type SwapProps = {
  program: anchor.Program<anchor.Idl>;
  wallet: any;
  amount: anchor.BN
};

const ROUTER_PDA_SEED = "router";
const ESCROW_PDA_SEED = "escrow";


interface PDAParam {
    key: anchor.web3.PublicKey,
    bump: number
}

const getAtaAccount = async(wallet: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> =>{
  
  let userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMint,
      wallet
  )
  return userAssociatedTokenAccount
}


const getRouterPDA = async(program: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey
  .findProgramAddress(
      [
      anchor.utils.bytes.utf8.encode(ROUTER_PDA_SEED),
      tokenMint.toBuffer(),
      ],
      program.programId
  );

  return {
      key: pda,
      bump: bump
  }
}

const getEscrowPDA = async(program: any): Promise<PDAParam> => {
  const [pda, bump] = await anchor.web3.PublicKey
  .findProgramAddress(
      [
      anchor.utils.bytes.utf8.encode(ESCROW_PDA_SEED),
      tokenMint.toBuffer(),
      ],
      program.programId
  );

  return {
      key: pda,
      bump: bump
  }
}
export const swap = async ({
  program,
  wallet,
  amount,
}: SwapProps) => {
  let routerPDA = await getRouterPDA(program);
  let escrowPDA = await getEscrowPDA(program);
  let userTokenAccount = await getAtaAccount(wallet.publicKey);
  console.log(routerPDA.key.toBase58());
  console.log(escrowPDA.key.toBase58())
  console.log(`Program id: ${program.programId.toBase58()}`)
  try{
    await program.methods.swap(amount).accounts({
        user: wallet.publicKey,
        router: routerPDA.key,
        tokenMint: tokenMint, 
        escrow: escrowPDA.key, 
        userTokenAccount: userTokenAccount,
      }).signers([]).rpc();
  }catch(e){
    console.log(e)
  }

};
