use anchor_lang::prelude::*;
use crate::{state::Router};
use anchor_spl::token::{ Mint, TokenAccount};

use crate::{ROUTER_PDA_SEED,ESCROW_PDA_SEED};
use std::str;

/// Initialize functions will init a router to control the swap process, and also create an escrow to hold token under the router's authority
pub fn initialize(
    ctx: Context<Initialize>,
    token_decimal: u8
)-> Result<()> {
    let router = &mut ctx.accounts.router;
    let initializer = &ctx.accounts.initializer;
    let token_mint = &ctx.accounts.token_mint;

    router.initializer = initializer.key();
    router.token_mint = token_mint.key();
    router.token_price = 10;
    router.token_decimal = token_decimal;
    router.sol_received = 0;
    router.sol_claimed = 0;
    router.bump = *ctx.bumps.get(str::from_utf8(ROUTER_PDA_SEED).unwrap()).unwrap();
    router.escrow_bump = *ctx.bumps.get(str::from_utf8(ESCROW_PDA_SEED).unwrap()).unwrap();
    
    msg!("initializer: {}", initializer.key());
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer=initializer, 
        space = Router::LEN,
        seeds = [ROUTER_PDA_SEED.as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub router: Account<'info, Router>,

    #[account(
        init, 
        payer=initializer,
        seeds=[ESCROW_PDA_SEED.as_ref(), token_mint.key().as_ref()],
        bump,
        token::mint=token_mint,
        token::authority=router,
    )]
    pub escrow: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: This is not dangerous 
    pub token_program: AccountInfo<'info>
}