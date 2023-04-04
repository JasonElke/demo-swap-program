use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::Transfer;

use crate::ROUTER_PDA_SEED;
use crate::ESCROW_PDA_SEED;
use crate::state::Router;
use anchor_spl::token::{TokenAccount, Mint};
use crate::errors::SwapError;

// SIMPLE function to swap SOL using the contract
pub const ONE_SOL: u64 = 1000000000;

pub fn swap(
    ctx: Context<Swap>,
    swap_amount: u64
)-> Result<()> {
    let user = &mut ctx.accounts.user;
    let router = &mut ctx.accounts.router;

    let escrow = &mut ctx.accounts.escrow;
    let user_token_account = &mut ctx.accounts.user_token_account;
    let token_program = &ctx.accounts.token_program;
    
    // Get SOL from the signer
    router.sol_received += swap_amount;
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(), 
        system_program::Transfer {
            from: user.to_account_info(),
            to: router.to_account_info(),
        });
    system_program::transfer(cpi_context, swap_amount)?;

    // Transfer token back to the user 
    let amounts_out = router.get_amounts_out(swap_amount);

    require!(escrow.amount >= amounts_out, SwapError::InsufficientFund);
    let bump_vector = router.bump.to_le_bytes();

    let inner = vec![
        ROUTER_PDA_SEED.as_ref(),
        router.token_mint.as_ref(),
        router.id.as_ref(), 
        bump_vector.as_ref()
    ];
    let outer = vec![inner.as_slice()];

    let transfer_ix = Transfer {
        from: escrow.to_account_info(),
        to: user_token_account.to_account_info(),
        authority: router.to_account_info()
    };

    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        transfer_ix,
        outer.as_slice()
    );
    anchor_spl::token::transfer(cpi_ctx, amounts_out)?;
    Ok(())
}


#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [ROUTER_PDA_SEED, token_mint.key().as_ref(), router.id.as_ref()], bump = router.bump
    )]
    pub router: Account<'info, Router>,
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,

    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, token_mint.key().as_ref(), router.id.as_ref()], bump = router.escrow_bump
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is not dangerous
    pub token_program: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub associated_token_program: AccountInfo<'info>,
}