# SOLANA PROGRAM
A Program that allow from SOL to SPACE tokens.
## Demo website
    *   
    *   Mint token address: 2stmR4nWKAKfhsvmZpkJd2vqc7CuLTp5A9roneaHjnSG

2. Program structure 
The program using the following mechanism to handle the `swap` from SOL to SPACE tokens.

Typically, the program's current state is saved in the `programs/demo-swap-program/src/state/` directory, while the program's instructions are stored in `programs/demo-swap-program/src/instructions/` directory.


1. To initialize a `router` account and an escrow, the initialize function in instructions/initialize.ts is used. The `router` and escrow are both created as Program Derived Accounts (PDAs) from the ROUTER_SEED_PHASE and ESCROW_SEED_PHASE, respectively, using the mint address of the SPACE token.

2. The `router` contains information regarding the `swap`, such as the `initializer`, who is the creator of the program and can withdraw funds to their preferred wallets, price, which determines the amount of SPACE a user will receive when they `swap` SOL for SPACE, and other details (see `programs/src/state/router.rs`). If the price is [10, 1], for example, a user can `swap` 1 SOL for 10 SPACE tokens. The `router` also receives and holds SOL from the `swap` operation, and the `initializer` can withdraw SOL back.

3. In order for a user to perform a `swap`, SPACE tokens must be deposited into the escrow to provide liquidity. The escrow only allows the `initializer` of the `router` to withdraw the funds.

4. When a user initiates a `swap`, they send SOL to the program and receive SPACE tokens in return. This process is carried out using the `swap` function (`instructions/swap`).

5. The `initializer` can withdraw SOL and SPACE tokens via the `withdraw_sol` and `withdraw_escrow` functions, respectively (`instructions/withdraw_sol.rs` and `withdraw_escrow.rs`).

### Deployment
This should be done like any Anchor project, so I will not elaborate


### Token
To create new tokens, run `ts-node scripts/create_token.ts` 

 **_NOTE:_**  The `SPACE` token metadata and uri for this project is temporaraly stored in the folder `demo-swap-program/metadata`


### Interact with the program 
Run the following  `ts-node scripts/tx/*.ts` to interact with each functions of the program.

 **_NOTE:_**: In order to interact with all the scripts, we need to `initialize` the program first (creating `router` and escrow accounts) by using file `initialize.ts`. And each time you initialize, you need to provide `token_mint`, which is located inside the `data.ts`. These data will be used to calculate the PDA needed to interact with the program properly.



## Testing 

The testing scripts is located in the `tests\` folders

Run `anchor test` to test the program

**_NOTE:_**  Before run the test, change the config in the `Anchor.toml` from devnet to localnet to test on the local.


## FE 
To run the FE, ``cd app`, remove the lock file and node modules if there are any, and run `yarn && yarn dev`