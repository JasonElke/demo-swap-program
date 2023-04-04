use anchor_lang::{prelude::*};
use crate::{state::Router, ROUTER_PDA_SEED};


pub fn withdraw_sol(
    ctx: Context<WithdrawSol>,
    
)-> Result<()> {
    let router = &mut ctx.accounts.router;
    let initializer = &ctx.accounts.initializer;
    
    let withdraw_amount = router.sol_received - router.sol_claimed;
    router.sol_claimed += withdraw_amount;

    **router.to_account_info().try_borrow_mut_lamports()? -= withdraw_amount;
    **initializer.try_borrow_mut_lamports()? += withdraw_amount;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
       mut, 
       seeds = [ROUTER_PDA_SEED, router.token_mint.as_ref(), router.id.as_ref()], bump = router.bump,
       has_one = initializer
    )]
    pub router: Account<'info, Router>,    
    pub system_program: Program<'info, System>,
}