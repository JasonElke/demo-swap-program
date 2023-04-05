import {Account} from"./provider/account";

import { createAssociatedWalletAndMint, createMintToken, createTokenMetadata } from "./utils/token";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";

const  main = async() => {
    const account = new Account();
    const mintAmount = BigInt(1000000000000); // 1 mil SPACE token

    let tokenMint = await createMintToken(account.provider, 6);
    console.log(`Mint successfully: ${tokenMint}`)

    await createAssociatedWalletAndMint(account.provider, account.deployer, tokenMint, mintAmount);

    const tokenMetadata = {
      name: "Space Station",
      symbol: "SPACE",
      uri: "https://raw.githubusercontent.com/JasonElke/demo-swap-program/develop/metadata/metadata.json",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null
    } as DataV2;
    await createTokenMetadata(account.provider, account.deployer, tokenMint, tokenMetadata);
}
  
main().catch(error => console.log(error));