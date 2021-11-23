import * as util from 'util';
import { AccountStatus } from './account.interface';
import { getConfig, IConfig } from './config';
import { AccountsReader as AccountManager } from './accountmanager';
import { TokenTool } from './tokentool';

(async () => {
  try {
    // Read environment variables for configuration (EXIT if not all set)
    const config: IConfig = getConfig();
    const tokenTool = new TokenTool(config.distributionSecret, true);

    const manager = new AccountManager();
    const jsonFilename = './data/addresses.json';
  
    switch (process.argv[2]) {
      case 'csvtojson':
        await manager.loadFromCSV('./data/addresses.csv');
        manager.writeToJSON(jsonFilename);

        break;
      case 'resolve':
        manager.loadFromJSON(jsonFilename);
        await manager.resolveMissingAddresses(tokenTool);
        manager.writeToJSON(jsonFilename);

        break;
      case 'create':
        // Create all accounts (or none on failure)
        manager.loadFromJSON(jsonFilename);
        const addr = manager.getAddresses(AccountStatus.RESOLVED);

        try {
          console.log(`Going to create ${addr.length} accounts`);

          await tokenTool.createAccounts(addr);
          
          console.log(`Created ${addr.length} accounts`);
          manager.setStatus(addr, AccountStatus.CREATED);
          manager.writeToJSON(jsonFilename);

        } catch (err) {
          console.log(util.inspect(err, { depth: 5 }));

          //{"transaction":"tx_failed","operations":["op_already_exists","op_already_exists","op_already_exists"]}
          if ((<any> err).transaction == 'tx_failed' && Array.isArray((<any> err).operations)) {
            const existingAccounts: string[] = [];

            for (let index = 0; index < (<any> err).operations.length; index++) {
              if ((<any> err).operations[index] === 'op_success') {
                continue;
              }

              if ((<any> err).operations[index] === 'op_already_exists') {
                // the operation failed because this account was created before
                console.log(`Address ${addr[index]} was already created`);

                existingAccounts.push(addr[index]);
              } else {
                console.error(`!!! Error on address ${addr[index]} : ${(<any> err).operations[index]}`);
              }
            }

            // Only set accounts that already existed to CREATED.
            // The others have not been updated; the transaction failed because of these failing operations.
            manager.setStatus(existingAccounts, AccountStatus.CREATED);
            manager.writeToJSON(jsonFilename);

            throw new Error(`${existingAccounts.length} accounts already existed; transaction failed. Status updated for existing accounts, please try again`);
          } else {
            throw err;
          }
        }
        break;
      case 'fund':
        // Create claimable balances for all CREATED accounts
        manager.loadFromJSON(jsonFilename);
        const addresses = manager.getAddresses(AccountStatus.CREATED);

        await tokenTool.createClaimableBalances(addresses, config.currencyCode, config.issuer, config.amount);
        manager.setStatus(addresses, AccountStatus.FUNDED);
        manager.writeToJSON(jsonFilename);

        break;
      default:
        console.log('Usage: node dist/index.js [csvtojson, resolve, create, fund]');
        break;
    }
  } catch (err) {
    console.log(util.inspect(err, { depth: 5 }));
    process.exit(1);
  }
})();
