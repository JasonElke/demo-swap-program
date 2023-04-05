import { SwapAccount } from "../provider/swap_account";
import * as anchor from "@project-serum/anchor";

import {env} from "../data";
import { getAtaAccount } from "../utils/token";


const main = async() => {
    const swap_token = new anchor.web3.PublicKey(env.swap_token);
    const swapAccount = new SwapAccount(swap_token);
 
    let deployerATA = await getAtaAccount(swap_token, swapAccount.deployer.publicKey);
    let swapAmount = new anchor.BN(1000000000); // 1 SOL -> get 10 SPACE
    await swapAccount.swap(swapAccount.deployer, deployerATA, swapAmount);
}
  
main().catch(error => console.log(error));