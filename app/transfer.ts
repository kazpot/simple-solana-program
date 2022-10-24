import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Keypair, Transaction } from "@solana/web3.js";
import { TokenContract } from "../target/types/token_contract";
import { web3 } from "@project-serum/anchor";

require("dotenv").config();

(async () => {
  const fromHexString = (hexString: string) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
    );

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .TokenContract as anchor.Program<TokenContract>;

  const mintKeyHex = process.env.MINT_KEY ?? "";
  const mintKeyBytes = fromHexString(mintKeyHex);
  let mintKey = web3.Keypair.fromSecretKey(Uint8Array.from(mintKeyBytes));
  console.log("tokenAddress: " + mintKey.publicKey);

  const fromKey = anchor.AnchorProvider.env().wallet;
  console.log("fromAddress: " + fromKey.publicKey.toString());
  const fromATA = await getAssociatedTokenAddress(
    mintKey.publicKey,
    fromKey.publicKey
  );

  const toKey: Keypair = Keypair.generate();
  console.log("toAddress: " + toKey.publicKey.toString());

  const toATA = await getAssociatedTokenAddress(
    mintKey.publicKey,
    toKey.publicKey
  );

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      fromKey.publicKey,
      toATA,
      toKey.publicKey,
      mintKey.publicKey
    )
  );

  let txSig = await anchor.AnchorProvider.env().sendAndConfirm(tx, []);
  console.log("create toAccount - txSig: ", txSig);

  txSig = await program.methods
    .transferToken()
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      from: fromATA,
      signer: fromKey.publicKey,
      to: toATA,
    })
    .rpc();

  console.log("transferToken - txSig: ", txSig);
})();
