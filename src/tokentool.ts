import * as StellarSdk from 'stellar-sdk';

export class TokenTool {
  private sourceKeypair: any;
  private server: StellarSdk.Server;
  private network: StellarSdk.Networks;

  constructor(secretKey: string, liveNetwork: boolean = false) {
    this.sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

    if (liveNetwork) {
      this.network = StellarSdk.Networks.PUBLIC;
      this.server = new StellarSdk.Server('https://horizon.stellar.org');
      console.log('>>>>>>>>> USING PUBLIC NETWORK <<<<<<<<<');
    } else {
      this.network = StellarSdk.Networks.TESTNET;
      this.server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      console.log('--------- using test network ----------');
    }
  }

  public generateRandomAccounts(count: number): string[] {
    if  (this.network !== StellarSdk.Networks.TESTNET) {
      throw new Error('Not going to create random accounts on live network');
    }
    console.log(StellarSdk.Keypair.random().secret());

    const publicKeys = [];
    const secrets = [];
    for (let index = 0; index <= count; index++) {
      const key = StellarSdk.Keypair.random();
      console.log(key.secret());
      secrets.push(key.secret());
      publicKeys.push(key.publicKey());
    }
    console.log(secrets);
    console.log(publicKeys);

    return publicKeys;
  }

  public async createAccounts(accountIds: string[]): Promise<void>  {
    const tx = (await this.getTransactionBuilder()).setTimeout(30);
 
    // Add one create account operation per account
    for (let index = 0; index < accountIds.length; index++) {
      tx.addOperation(StellarSdk.Operation.createAccount({
        destination: accountIds[index],
        startingBalance: '1.6',
      }));
    };

    await this.signAndSubmit(tx.build());
  }

  public async createClaimableBalance(accountIds: string[], code: string, issuer: string, amount: string): Promise<void> { 
    const tx = (await this.getTransactionBuilder())
      .addOperation(StellarSdk.Operation.createClaimableBalance({
        asset: new StellarSdk.Asset(code, issuer),
        claimants: accountIds.map(id => new StellarSdk.Claimant(id, StellarSdk.Claimant.predicateBeforeRelativeTime((60*60*24*7).toString()))),
        amount
      }))
      .setTimeout(30)
      .build();

    await this.signAndSubmit(tx);
  }

  public async createAndFund(accountId: string, code: string, issuer: string, amount: string): Promise<void> {
    const tx = (await this.getTransactionBuilder())
      .addOperation(StellarSdk.Operation.createAccount({
        destination: accountId,
        startingBalance: '1.6',
      }))
      .addOperation(StellarSdk.Operation.createClaimableBalance({
        asset: new StellarSdk.Asset(code, issuer),
        claimants: [
          new StellarSdk.Claimant(accountId, StellarSdk.Claimant.predicateBeforeRelativeTime((60*60*24*7).toString()))
        ],
        amount
      }))
      .setTimeout(30)
      //.addMemo(StellarSdk.Memo.text('Hello world!'))
      .build();

    await this.signAndSubmit(tx);
  }

  public async getAccountId(federated: string): Promise<string> {
    const result = await StellarSdk.FederationServer.resolve(federated);
    const accountId = result.account_id;
    console.log(`${federated} = ${accountId}`);

    return accountId;
  }

  private async getTransactionBuilder(): Promise<StellarSdk.TransactionBuilder> {
    const source = await this.server.loadAccount(this.sourceKeypair.publicKey());
    const fee = await this.server.fetchBaseFee();

    return new StellarSdk.TransactionBuilder(source, { 
      fee: fee.toString(),  
      networkPassphrase: this.network
    });
  }

  private async signAndSubmit(tx: StellarSdk.Transaction): Promise<void> {
    tx.sign(this.sourceKeypair);

    try {
      const transactionResult = await this.server.submitTransaction(tx);
      console.log(`Success! View the transaction at: ${(transactionResult as any)._links.transaction.href}`);
    } catch (err: any) {
      console.log('An error has occured submitting the transaction');
      if (err.response?.data?.extras?.result_codes) {
        throw new Error(`Transaction failed: ${JSON.stringify(err.response.data.extras.result_codes)}`);
      }

      throw err;
    }
  }
}
