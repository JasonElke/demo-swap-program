import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapAccount } from "../scripts/provider/swap_account";
import { createMintToken, createUserAndAssociatedWallet, getSplBalance, transferToken } from "../scripts/utils/token";
import { DemoSwapProgram } from "../target/types/demo_swap_program";
import * as assert from "assert";

const SPACE_DECIMAL = 6;
const SPACE_PRICE = new anchor.BN(10); // 1 space = 0.1 SOL
const swapAmount = new anchor.BN(1000000000); // Bob is going to swap 1 SOL for 10 SPACE
let expectedReceiveAmount= null; // Expected amount that Bob is going to receive
const depositAmount = 10000000; // Amount that alice use to deposit to the escrow (add liquidity)

describe("demo-swap-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DemoSwapProgram as Program<DemoSwapProgram>;
  let swapAccount: SwapAccount;

  // We are going to work with this SPACE token latter
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
     * token_mint: The mint address of the SPACE token. 
     * 
     * deployer, deployer_token_wallet: The initializer of the program (The escrow contract token - not added yet). The initializer can withdraw SOL and SPACE token from the program (router & escrow)
     * alice - alice_token_wallet: Alice wallet is created, and she will get some SPACE tokens.  Alice will be the one who provide liquidity by putting SPACE token in to the escrow
     * bob - bob_token_wallet: Bob and his ata token account will be created, but he gets no SPACE token initially
     */
    
    token_mint = await createMintToken(provider, SPACE_DECIMAL);
    [deployer, deployer_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,true, INITIAL_DEPLOYER_BALANCE);
    [alice, alice_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,true, INITIAL_ALICE_TOKEN_BALANCE);
    [bob, bob_token_wallet] = await createUserAndAssociatedWallet(provider,token_mint,false); 

    swapAccount = new SwapAccount(token_mint, provider, deployer); // for my bot, need to add the provider and the deployer inorder to use localnet
  });


  it("Inititalize", async() => {
    await swapAccount.initialize(deployer, SPACE_DECIMAL);
    let routerPDA = await swapAccount.getRouterPDA();
    let escrowPDA = await swapAccount.getEscrowPDA();

    let routerInfo =  await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let escrowInfo =  await swapAccount.provider.connection.getAccountInfo(escrowPDA.key);

    assert.ok(routerInfo.lamports > 0, "Router has not been created");
    assert.ok(escrowInfo.lamports > 0, "Escrow has not been created");
  });

  it("Swap", async() => { 
    const routerPDA = await swapAccount.getRouterPDA();
    let routerInfo = await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let beforeSwapControllerBalance = routerInfo.lamports;
    
    let bobInfo = await swapAccount.provider.connection.getAccountInfo(bob.publicKey);
    let beforeSwapBobBalance = bobInfo.lamports;

    let escrowPDA = await swapAccount.getEscrowPDA(); 
    await transferToken(swapAccount.provider, alice_token_wallet, escrowPDA.key, alice, depositAmount);

    // Bob swap
    await swapAccount.swap(bob, bob_token_wallet, swapAmount);

    routerInfo = await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let afterSwapControllerBalance = routerInfo.lamports;

    bobInfo = await swapAccount.provider.connection.getAccountInfo(bob.publicKey);
    let afterSwapBobBalance = bobInfo.lamports;

     // ASSERTION
    /**
     * Router SOL balance should increase by: 1 SOL (10^9 lamports)
     * Bob token wallet balance should increase by: 10 SPACE (10 * 10^SPACE_DECIMAL) 
     */
    assert.ok(beforeSwapBobBalance - afterSwapBobBalance >= swapAmount.toNumber(), "Bob balance should be deducted by an amount greater than 1 SOL"); // bob pay some lamports for gas fee 
    assert.ok(afterSwapControllerBalance - beforeSwapControllerBalance == swapAmount.toNumber(), "Router Balance should increase by an swap amount");

    let bobSpaceBalance = await getSplBalance(swapAccount.provider, bob_token_wallet);
    expectedReceiveAmount = swapAmount.mul(SPACE_PRICE).mul(new anchor.BN(10).pow(new anchor.BN(SPACE_DECIMAL))).div(SOL_TO_LAMPORT)
    assert.ok(expectedReceiveAmount.toNumber() == Number(bobSpaceBalance), "Bob receive an incorect amount");
  })  

  it("Alice cannot withdraw SOL", async()=> {
    try {
      await swapAccount.withdrawSol(alice)
    }
    catch (error) {
      assert.equal(error.error.errorMessage, 'A has one constraint was violated', "wrong error msg");
      return;
    }
    assert.fail("The instruction should fail since alice is not the initializer");
  })

  it("Deployer can withdraw SOL", async() => {
    const routerPDA = await swapAccount.getRouterPDA();
    let routerInfo = await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let beforeSwapControllerBalance = routerInfo.lamports;
    
    let deployerInfo = await swapAccount.provider.connection.getAccountInfo(deployer.publicKey);
    let beforeSwapDeployerBalance = deployerInfo.lamports;

    //Deployer withdraw SOL
    await swapAccount.withdrawSol(deployer);

    routerInfo = await swapAccount.provider.connection.getAccountInfo(routerPDA.key);
    let afterSwapControllerBalance = routerInfo.lamports;
    
    deployerInfo = await swapAccount.provider.connection.getAccountInfo(deployer.publicKey);
    let afterSwapDeployerBalance = deployerInfo.lamports;
  
    assert.ok(beforeSwapControllerBalance - afterSwapControllerBalance == swapAmount.toNumber(), "The SOL balance in the router should get deducted");
    assert.ok(afterSwapDeployerBalance - beforeSwapDeployerBalance >= (swapAmount.toNumber() - 100000), "The SOL balance in the deployer should get increase"); // minus some tx fee
  })

  it("Alice cannot withdraw SPACE", async()=> {
    try {
      await swapAccount.withdrawEscrow(alice, alice_token_wallet)
    }
    catch (error) {
      assert.equal(error.error.errorMessage, 'A has one constraint was violated', "wrong error msg");
      return;
    }
    assert.fail("The instruction should fail since alice is not the initializer");
  })

  it("Deployer can withdraw SPACE", async()=>{
    let escrowPDA = await swapAccount.getEscrowPDA();
    // Check escrow balacne 
    let beforeEscrowBalance = await getSplBalance(swapAccount.provider, escrowPDA.key);

    let beforeDeployerBalance = await getSplBalance(swapAccount.provider, deployer_token_wallet);
    await swapAccount.withdrawEscrow(deployer, deployer_token_wallet)

    let afterEscrowBalance = await getSplBalance(swapAccount.provider, escrowPDA.key);
    let afterDeployerBalance = await getSplBalance(swapAccount.provider, deployer_token_wallet);

    assert.ok(beforeEscrowBalance - afterEscrowBalance == BigInt(depositAmount- expectedReceiveAmount), "Escrow balance should get deducted ");
    assert.ok(afterDeployerBalance - beforeDeployerBalance == BigInt(depositAmount- expectedReceiveAmount), "Deployer balance should get increased");
  })  
});
