import * as anchor from "@project-serum/anchor";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { TokenContract } from "../target/types/token_contract";

require("dotenv").config();

(async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const key = anchor.AnchorProvider.env().wallet;
  console.log("solana public address: " + key.toString());

  const program = anchor.workspace
    .TokenContract as anchor.Program<TokenContract>;
  const mintKey: Keypair = Keypair.generate();
  console.log(
    "mint key hex: " + Buffer.from(mintKey.secretKey).toString("hex")
  );

  const lamports: number =
    await program.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKey.publicKey,
    key.publicKey
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: key.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(
      mintKey.publicKey,
      0,
      key.publicKey,
      key.publicKey
    ),
    createAssociatedTokenAccountInstruction(
      key.publicKey,
      associatedTokenAccount,
      key.publicKey,
      mintKey.publicKey
    )
  );

  let txSig = await anchor.AnchorProvider.env().sendAndConfirm(tx, [mintKey]);
  console.log(
    "account: ",
    await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
  );

  console.log("call initializeMint - txSig: ", txSig);
  console.log("tokenAddress: ", mintKey.publicKey.toString());
  console.log("myAddress: ", key.toString());

  txSig = await program.methods
    .mintToken()
    .accounts({
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      payer: key.publicKey,
    })
    .rpc();
  console.log("call mintToken - txSig: ", txSig);
})();
