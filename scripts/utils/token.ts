import * as anchor from "@project-serum/anchor";
import * as spl from '@solana/spl-token';
import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { findMetadataPda } from "@metaplex-foundation/js";


export const createMintToken = async (provider: anchor.AnchorProvider, decimal: number): Promise<anchor.web3.PublicKey> => {
    const tokenMint = new anchor.web3.Keypair();
    const lamportsForMint = await provider.connection.getMinimumBalanceForRentExemption(spl.MintLayout.span);
    let txCreateMint = new anchor.web3.Transaction();

    // Allocate mint
    txCreateMint.add(
        anchor.web3.SystemProgram.createAccount({
            programId: spl.TOKEN_PROGRAM_ID,
            space: spl.MintLayout.span,
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: tokenMint.publicKey,
            lamports: lamportsForMint,
        })
    );

    // Allocate wallet account
    txCreateMint.add(
      spl.createInitializeMintInstruction(
        tokenMint.publicKey,
        decimal,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      )
    );
    const txCreateMintSig = await provider.sendAndConfirm(txCreateMint, [tokenMint]);

    console.log("txCreateMintSig: ", txCreateMintSig);

    return tokenMint.publicKey;
  }


export const getAtaAccount = async(mint: anchor.web3.PublicKey, wallet: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> =>{
    let userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
        mint,
        wallet
    );
    return userAssociatedTokenAccount
}


export const createAtaAccount = async(provider: anchor.AnchorProvider, fee_payer:anchor.web3.Keypair, mint: anchor.web3.PublicKey, user: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
     // Create a token account for the user and mint some tokens
    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      mint,
      user
    );

    const txCreateAtaAccount = new anchor.web3.Transaction();
    txCreateAtaAccount.add(spl.createAssociatedTokenAccountInstruction(
      fee_payer.publicKey,
      userAssociatedTokenAccount,
      user,
      mint
    ));

    const txCreateAtaAccountSig = await provider.sendAndConfirm(txCreateAtaAccount, [fee_payer]);
    
    console.log("txCreateAtaAccount: ", txCreateAtaAccount)

    return userAssociatedTokenAccount
}

/// This function faucets SOL for each new created account, and determine if either create asssociated wallet and mint token to that ATA account of the mint Account
export const createUserAndAssociatedWallet = async (provider: anchor.AnchorProvider, mint: anchor.web3.PublicKey, createAta: boolean, amount?: bigint ): Promise<[anchor.web3.Keypair, anchor.web3.PublicKey | undefined]> => {
    const user = new anchor.web3.Keypair();
    let userAssociatedTokenAccount: anchor.web3.PublicKey | undefined = undefined;

    // Fund user with 5 SOL
    let txFund = new anchor.web3.Transaction();
    txFund.add(anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: user.publicKey,
        lamports: 5 * anchor.web3.LAMPORTS_PER_SOL,
    }));
    await provider.sendAndConfirm(txFund);

    if (mint) {
        // get ATA of user
        userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
            mint,
            user.publicKey
        );
          
        if (!amount && createAta == false){
          //pass 
        } else{
          const txFundTokenAccount = new anchor.web3.Transaction();
          if (createAta){
            // Add instruction create a token account for user to tx
            txFundTokenAccount.add(spl.createAssociatedTokenAccountInstruction(
              user.publicKey,
              userAssociatedTokenAccount,
              user.publicKey,
              mint
            ));
          }
        
          if (amount){
            // Add instruction mint some tokens for user to tx
            txFundTokenAccount.add(spl.createMintToInstruction(
              mint,
              userAssociatedTokenAccount,
              provider.wallet.publicKey,
              amount
            ));
        }
        
        await provider.sendAndConfirm(txFundTokenAccount, [user]);
        await spl.getAccount(provider.connection, userAssociatedTokenAccount);
      }
        
    }
    return [user, userAssociatedTokenAccount];
}  

export const createAssociatedWalletAndMint = async(provider: anchor.AnchorProvider,wallet: anchor.web3.Keypair, mint: anchor.web3.PublicKey, amount: bigint) =>{ 
  const txCreateAssociatedWalletAndMint = new anchor.web3.Transaction();

    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    )

    txCreateAssociatedWalletAndMint.add(spl.createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      userAssociatedTokenAccount,
      wallet.publicKey,
      mint
    ))

    txCreateAssociatedWalletAndMint.add(spl.createMintToInstruction(
      mint,
      userAssociatedTokenAccount,
      provider.wallet.publicKey,
      amount
    ))

    const txCreateAssociatedWalletAndMintSig = await provider.sendAndConfirm(txCreateAssociatedWalletAndMint, [wallet]);
    console.log("txCreateAssociatedWalletAndMintSig: ", txCreateAssociatedWalletAndMintSig);
}

export const createTokenMetadata = async(provider: anchor.AnchorProvider, wallet: anchor.web3.Keypair, mint: anchor.web3.PublicKey, tokenMetaData: DataV2)=>{
  const metadataPDA = await findMetadataPda(mint);

  const txCreateTokenMetadata = new anchor.web3.Transaction();

  txCreateTokenMetadata.add(
    createCreateMetadataAccountV2Instruction({
      metadata: metadataPDA,
      mint: mint, 
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      updateAuthority: wallet.publicKey
    },{
      createMetadataAccountArgsV2:{
        data: tokenMetaData,
        isMutable: true
      }
    })
  )
  const txCreateTokenMetadataSig = await provider.sendAndConfirm(txCreateTokenMetadata, [wallet]);
  console.log("txCreateTokenMetadataSig: ", txCreateTokenMetadataSig );
}

export const transferToken = async(provider: anchor.AnchorProvider, source: anchor.web3.PublicKey, destination: anchor.web3.PublicKey, owner: anchor.web3.Keypair, amount: number)=>{
  const txTransfer = new anchor.web3.Transaction;

  txTransfer.add(spl.createTransferInstruction(
    source,
    destination,
    owner.publicKey,
    amount
  ));
  await provider.sendAndConfirm(txTransfer, [owner]);
}

export const approveToken = async(provider: anchor.AnchorProvider, account: anchor.web3.PublicKey, delegate: anchor.web3.PublicKey, owner: anchor.web3.Keypair, amount: bigint)=>{
  const txTransfer = new anchor.web3.Transaction;

  txTransfer.add(spl.createApproveInstruction(
    account, 
    delegate, 
    owner.publicKey, 
    amount
  ));
  await provider.sendAndConfirm(txTransfer, [owner]);
}

export const getSplAccountInfo = async(provider: anchor.AnchorProvider, tokenAccount: anchor.web3.PublicKey) =>{
  return await spl.getAccount(provider.connection, tokenAccount)
}

export const getSplBalance = async(provider: anchor.AnchorProvider, tokenAccount: anchor.web3.PublicKey) =>{
  const accountInfo = await spl.getAccount(provider.connection, tokenAccount);
  return accountInfo.amount;
}