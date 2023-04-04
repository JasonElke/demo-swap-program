use anchor_lang::prelude::*;
const SOL_TO_LAMPORTS: u128 = 1000000000;
use crate::{MAX_STRING_LEN};

#[account]
pub struct Router{
    pub initializer: Pubkey,
    pub bump: u8,
    pub token_mint: Pubkey,
    pub token_decimal: u8,
    pub token_price: u8, // Price, denominator: 1 SOL = 10 Token
    pub sol_received: u64,
    pub sol_claimed: u64,
    pub escrow_bump: u8
}

const PUBLIC_KEY_LENGTH: usize = 32;
const U8_SIZE_LENGTH: usize = 1;
const U64_SIZE_LENGTH: usize = 8;

impl Router{ 
    pub const LEN: usize = PUBLIC_KEY_LENGTH
        + U8_SIZE_LENGTH 
        + PUBLIC_KEY_LENGTH 
        + U8_SIZE_LENGTH
        + U8_SIZE_LENGTH
        + U64_SIZE_LENGTH 
        + U64_SIZE_LENGTH
        + U8_SIZE_LENGTH;
    

    pub fn get_amounts_out(&self, lamports_amount: u64) -> u64 {
        let amount_out =  lamports_amount as u128 * self.token_price as u128 * 10u128.pow(self.token_decimal as u32) as u128 / SOL_TO_LAMPORTS;
        amount_out as u64
    }
}