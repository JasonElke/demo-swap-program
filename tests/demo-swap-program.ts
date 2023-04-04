import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapAccount } from "../scripts/provider/swap_account";
import { createMintToken, createUserAndAssociatedWallet, getSplBalance, transferToken } from "../scripts/utils/token";
import { DemoSwapProgram } from "../target/types/solana_swap_dapp";
import * as assert from "assert";

const MOVE_DECIMAL = 6;
const MOVE_PRICE = [new anchor.BN(10), new anchor.BN(1)]; // 1 move = 0.1 SOL
const swapAmount = new anchor.BN(1000000000); // Bob is going to swap 1 SOL for 10 MOVE
let expectedReceiveAmount= null; // Expected amount that Bob is going to receive
const depositAmount = 10000000; // Amount that alice use to deposit to the escrow (add liquidity)

describe("solana-swap-dapp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaSwapDapp as Program<DemoSwapProgram>;

  let swapAccount: SwapAccount;

  // We are going to work with this MOVE token latter
  let token_mint: anchor.web3.PublicKey;

  let deployer: anchor.web3.Keypair;
  let deployer_token_wallet: anchor.web3.PublicKey;

  let alice: anchor.web3.Keypair;
  let alice_token_wallet: anchor.web3.PublicKey;

  let bob: anchor.web3.Keypair;
  let bob_token_wallet: anchor.web3.PublicKey;

  const SOL_TO_LAMPORT = new anchor.BN(1000000000)

  const INITIAL_DEPLOYER_BALANCE = BigInt(1000000000000);
  const INITIAL_ALICE_TOKEN_BALANCE = BigInt(10000000000);

  it("Set up test space!", async () => {
    
    /**
     * SwapAccount: the program instance in which we can use to test and interact with the blockchain 
     * 
     * token_mint: The mint address of the MOVE token. 
     * 
     * deployer, deployer_token_wallet: The initializer of the program (The escrow contract token - not added yet). The initializer can withdraw SOL and MOVE token from the program (router & escrow)
     * alice - alice_token_wallet: Alice wallet is created, and she will get some MOVE tokens.  Alice will be the one who provide liquidity by putting MOVE token in to the escrow
     * bob - bob_token_wallet: Bob and his ata token account will be created, but he gets no MOVE token initially
     */
    
    token_mint = await createMintToken(provider, MOVE_DECIMAL);
    [deployer, deployer_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,true, INITIAL_DEPLOYER_BALANCE); 
    [alice, alice_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,true, INITIAL_ALICE_TOKEN_BALANCE);
    [bob, bob_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,false); 

    swapAccount = new SwapAccount(token_mint, provider, deployer); // for my bot, need to add the provider and the deployer inorder to use localnet
  });


  it("Inititalize", async() => {
    await swapAccount.initialize(deployer, MOVE_DECIMAL);

    let routerPDA = await swapAccount.getRouterPDA();
    let escrowPDA = await swapAccount.getEscrowPDA();

    let routerInfo =  await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let escrowInfo =  await swapAccount.provider.connection.getAccountInfo(escrowPDA.key);

    assert.ok(routerInfo.lamports > 0, "Router has not been created");
    assert.ok(escrowInfo.lamports > 0, "Escrow has not been created");
  });

});
