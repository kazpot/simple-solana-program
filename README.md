# Simple Solana Program

1. mint SPL token
2. transfer SPL token

### Installation

- install anchor
  - https://book.anchor-lang.com/getting_started/installation.html

### Build

```
$ anchor build
```

### Deploy

```
$ anchor deploy
```

### Env

```
// create .env at root
ANCHOR_WALLET=$HOME/.config/solana/id.json
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
MINT_KEY=<token mint account key in hex>
MY_KEY=<wallet key in hex string>
```

### Test

```
$ anchor test
```

### Command

```
// mint
$ yarn mint

// transfer
$ yarn transfer
```
