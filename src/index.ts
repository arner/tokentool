import * as util from 'util';
import { getConfig, IConfig } from './config';
import { CSVReader } from './csvreader';
import { TokenTool } from './tokentool';

(async () => {
  try {
    // Read environment variables for configuration (EXIT if not all set)
    const config: IConfig = getConfig();
    const tokenTool = new TokenTool(config.distributionSecret, false);

    // Get accounts from CSV
    const reader = new CSVReader('./data/addresses.csv');
    const formResults = await reader.parse();
    console.log(`Found ${formResults.length} entries`);

    // Convert accounts to addresses (EXIT on error)
    const accounts: any[] = [];
    for (let index = 0; index < formResults.length; index++) {
      try {
        // append lobstr.co if people didn't add it yet
        const federated = formResults[index]['Lobstr account'].replace('*lobstr.co', '') + '*lobstr.co';
        accounts[index] = await tokenTool.getAccountId(federated);
      } catch (err: any) {
        if (err.response.status == 404) {
          throw new Error(`Address not found for ${JSON.stringify(formResults[index])}`);
        } else {
          throw err;
        }
      }
    }
    console.log('Accounts:');
    console.log(accounts);

    switch (process.argv[2]) {
      case 'create':
        // Create all accounts (or none on failure)
        await tokenTool.createAccounts(accounts);
        break;
      case 'fund':
        // Create claimable balances for all accounts
        await tokenTool.createClaimableBalance(accounts, config.currencyCode, config.issuer, config.amount);
        break;
        
      default:
        console.log('Usage: node dist/index.js [create, fund]');
        break;
    }
  } catch (err) {
    console.log(util.inspect(err, { depth: 5 }));
    process.exit(1);
  }
})();
