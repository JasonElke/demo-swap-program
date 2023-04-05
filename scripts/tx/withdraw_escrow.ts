import { SwapAccount } from "../provider/swap_account";
import * as anchor from "@project-serum/anchor";

import {env} from "../data";
import { getAtaAccount } from "../utils/token";

const main = async() => {
    const swap_token = new anchor.web3.PublicKey(env.swap_token);
    const swapAccount = new SwapAccount(swap_token);
 
    let deployerATA = await getAtaAccount(swap_token, swapAccount.deployer.publicKey);
    await swapAccount.withdrawEscrow(swapAccount.deployer, deployerATA);
}
  
main().catch(error => console.log(error));