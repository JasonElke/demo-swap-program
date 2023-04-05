import { SwapAccount } from "../provider/swap_account";
import * as anchor from "@project-serum/anchor";

import {env} from "../data";
import { getAtaAccount, transferToken } from "../utils/token";

const  main = async() => {
    const swap_token = new anchor.web3.PublicKey(env.swap_token);
    const swapAccount = new SwapAccount(swap_token);
    let escrowPDA = await swapAccount.getEscrowPDA();

    let deployerATA = await getAtaAccount(swap_token, swapAccount.deployer.publicKey);
    const depositAmount = 100000000000; // 100,000 SPACE
    await transferToken(swapAccount.provider, deployerATA, escrowPDA.key, swapAccount.deployer, depositAmount);
}
  
main().catch(error => console.log(error));