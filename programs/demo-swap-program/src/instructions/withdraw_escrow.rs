use anchor_lang::{prelude::*};
use crate::{state::Router, ROUTER_PDA_SEED, ESCROW_PDA_SEED};
use anchor_spl::token::{TokenAccount, Transfer};

pub fn withdraw_escrow(
    ctx: Context<WithdrawEscrow>,
    
)-> Result<()> {
    let router = &mut ctx.accounts.router;
    let escrow = &ctx.accounts.escrow;
    let initializer_token_acconunt = &ctx.accounts.initializer_token_account;
    let token_program = &ctx.accounts.token_program;

    // Transfer token to initializer
    let bump_vector = router.bump.to_le_bytes();

    let inner = vec![
        ROUTER_PDA_SEED.as_ref(),
        router.token_mint.as_ref(),
        bump_vector.as_ref()
    ];
    let outer = vec![inner.as_slice()];

    let transfer_ix = Transfer {
        from: escrow.to_account_info(),
        to: initializer_token_acconunt.to_account_info(),
        authority: router.to_account_info()
    };

    let amount = escrow.amount;
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        transfer_ix,
        outer.as_slice()
    );
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawEscrow<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
       mut, 
       has_one = initializer,
       seeds = [ROUTER_PDA_SEED, router.token_mint.as_ref()], bump = router.bump
    )]
    pub router: Account<'info, Router>,  
    
    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, router.token_mint.as_ref()], bump = router.escrow_bump
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(
        mut
    )]
    pub initializer_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    /// CHECK: This is not dangerous
    pub token_program: AccountInfo<'info>,
}