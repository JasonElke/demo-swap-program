import { SwapAccount } from "../provider/swap_account";
import * as anchor from "@project-serum/anchor";

import {env} from "../data";

const SPACE_DECIMAL = 6;

const  main = async() => {
    const swap_token = new anchor.web3.PublicKey(env.swap_token);
    const swapAccount = new SwapAccount(swap_token);
    
    await swapAccount.initialize(swapAccount.deployer, SPACE_DECIMAL);
}
  
  main().catch(error => console.log(error));