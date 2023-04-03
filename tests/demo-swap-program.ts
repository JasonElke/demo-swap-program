import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DemoSwapProgram } from "../target/types/demo_swap_program";

describe("demo-swap-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DemoSwapProgram as Program<DemoSwapProgram>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
