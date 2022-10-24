import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TokenContract } from "../target/types/token_contract";

require("dotenv").config();

const TO_ADDRESS = "9WxE6JWyMa17pSJfzLyds1SmgMu9h2FZDawP7uLdfwAo";

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
  const mintKey = Keypair.fromSecretKey(Uint8Array.from(mintKeyBytes));
  console.log("tokenAddress: " + mintKey.publicKey);

  const fromKeyHex = process.env.MY_KEY ?? "";
  const fromKeyBytes = fromHexString(fromKeyHex);
  const fromKey = Keypair.fromSecretKey(Uint8Array.from(fromKeyBytes));
  console.log("fromAddress: " + fromKey.publicKey.toString());

  const fromATA = await getAssociatedTokenAddress(
    mintKey.publicKey,
    fromKey.publicKey
  );

  const toKey = new PublicKey(TO_ADDRESS);
  console.log("toAddress: " + toKey.toString());

  const toATA = await getOrCreateAssociatedTokenAccount(
    anchor.getProvider().connection,
    fromKey,
    mintKey.publicKey,
    toKey
  );

  let txSig = await program.methods
    .transferToken()
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      from: fromATA,
      signer: fromKey.publicKey,
      to: toATA.address,
    })
    .rpc();

  console.log("transferToken - txSig: ", txSig);
})();
