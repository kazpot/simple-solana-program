import * as anchor from "@project-serum/anchor";
import { TokenContract } from "../target/types/token_contract";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  Transaction,
  SystemProgram,
  ParsedAccountData,
} from "@solana/web3.js";
import { assert } from "chai";

describe("token-contract", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .TokenContract as anchor.Program<TokenContract>;
  const mintKey: Keypair = Keypair.generate();
  let associatedTokenAccount = undefined;

  it("Mint a token", async () => {
    const key = anchor.AnchorProvider.env().wallet.publicKey;
    const lamports: number =
      await program.provider.connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );

    associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      key
    );

    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: key,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(mintKey.publicKey, 0, key, key),
      createAssociatedTokenAccountInstruction(
        key,
        associatedTokenAccount,
        key,
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
        payer: key,
      })
      .rpc();
    console.log("call mintToken - txSig: ", txSig);
    const balanceData = (
      await program.provider.connection.getParsedAccountInfo(
        associatedTokenAccount
      )
    ).value.data;
    const balance = (balanceData as ParsedAccountData).parsed.info.tokenAmount
      .amount;
    assert.equal(balance, 1000);
  });

  it("Transfer token", async () => {
    const key = anchor.AnchorProvider.env().wallet.publicKey;
    const toWallet: Keypair = Keypair.generate();
    const toATA = await getAssociatedTokenAddress(
      mintKey.publicKey,
      toWallet.publicKey
    );

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        key,
        toATA,
        toWallet.publicKey,
        mintKey.publicKey
      )
    );

    let txSig = await anchor.AnchorProvider.env().sendAndConfirm(tx, []);
    console.log("create to account - txSig: ", txSig);

    txSig = await program.methods
      .transferToken()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
        from: associatedTokenAccount,
        signer: key,
        to: toATA,
      })
      .rpc();

    console.log("transferToken - txSig: ", txSig);

    const fromBalanceData = (
      await program.provider.connection.getParsedAccountInfo(
        associatedTokenAccount
      )
    ).value.data;
    const fromBalance = (fromBalanceData as ParsedAccountData).parsed.info
      .tokenAmount.amount;

    const toBalanceData = (
      await program.provider.connection.getParsedAccountInfo(toATA)
    ).value.data;
    const toBalance = (toBalanceData as ParsedAccountData).parsed.info
      .tokenAmount.amount;

    assert.equal(fromBalance, 995);
    assert.equal(toBalance, 5);
  });
});
