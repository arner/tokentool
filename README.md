# Token tool

You probably shouldn't use this ;). I wrote it to issue a toy Stellar token in a workshop. See the code in index.ts and adapt to your needs if you want to try it at your own risk.

Run `tsc` to build.

1. Create an issuing account and fund it with 2 XLM. Create a distribution account and fund it with 2 XLM + the amount of accounts you want to sponsor * 1.6.
2. Export (from Google Forms or somewhere else) a CSV that contains unfunded lobstr addresses under a field called 'Lobstr account'. Save it under data/addresses.csv.
3. Set the following environment variables:
    ```
    export DISTRIBUTION= # the _secret_ of the distribution account
    export ISSUER= # the _public address_ of the issuing account
    export CODE= # the currency code of your token
    export AMOUNT= # the amount of tokens to make available to everyone
    ```
4. Fund the set of (registered but not created) Lobstr Stellar accounts with 1.6 XLM each: `node ./dist/index.js create`.
5. (Design the token, set the environment variables.)
6. On Stellar Laboratory: Create a trust line from Distribution to Issuance for the token.
7. On Stellar Laboratory: Issue the token by sending it to Distribution, and set the domain where you'll update the stellar.toml with the token info.
8. Create a claimable balance for accounts: `node ./dist/index.js fund`.