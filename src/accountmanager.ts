import csv from 'csv-parser';
import * as fs from 'fs';
import { AccountStatus, IAccount } from './account.interface';
import { TokenTool } from './tokentool';

export class AccountsReader {
  private accounts: IAccount[] = [];

  constructor(){}

  public getAddresses(status?: AccountStatus): string[] {
    let accounts = this.accounts.filter(a => !status || a.Status === status);
    const addresses = accounts.map(a => <string> a.Address).filter(a => !!a);

    if (addresses.length === 0) {
      throw new Error(`No addresses found with status ${status}`);
    }

    return addresses;
  }

  public setStatus(addresses: string[], status: AccountStatus) {
    for (let index = 0; index < this.accounts.length; index++) {
      if (!this.accounts[index].Address || <string> this.accounts[index].Address !in addresses) {
        continue;
      }

      switch (status) {
        case AccountStatus.RESOLVED:
          if (!this.accounts[index].Status || this.accounts[index].Status === AccountStatus.NONE) {
            this.accounts[index].Status = AccountStatus.RESOLVED;
          }

          break;
        case AccountStatus.CREATED:
          if (!this.accounts[index].Status || this.accounts[index].Status === AccountStatus.RESOLVED) {
            this.accounts[index].Status = AccountStatus.CREATED;
          }    

          break;
        case AccountStatus.FUNDED:
          if (!this.accounts[index].Status || this.accounts[index].Status === AccountStatus.CREATED) {
            this.accounts[index].Status = AccountStatus.FUNDED;
          }    

          break;
        default:
          throw new Error(`Status update not implemented: ${status}`);
      }
    }
  }

  public async resolveMissingAddresses(tokenTool: TokenTool): Promise<void> {
    let addressesAdded = 0;
    // Convert accounts to addresses (EXIT on error)
    for (let index = 0; index < this.accounts.length; index++) {
      try {
        if (this.accounts[index].Address) {
          console.log(`${this.accounts[index]['Lobstr account']} has Address set already`);

          continue;
        }

        // append lobstr.co if people didn't add it yet
        const federated = this.accounts[index]['Lobstr account'].replace('*lobstr.co', '') + '*lobstr.co';
        this.accounts[index].Address = await tokenTool.getAccountId(federated);


        addressesAdded++;
      } catch (err: any) {
        if (err.response.status == 404) {
          console.warn(`Address not found for ${JSON.stringify(this.accounts[index])}. Continuing...`);
          // throw new Error(`Address not found for ${JSON.stringify(this.accounts[index])}`);
        } else {
          throw err;
        }
      }
    }
    console.log(`Resolved ${addressesAdded} addresses`);

    // Set status for accounts with an address to resolved
    this.setStatus(this.getAddresses(), AccountStatus.RESOLVED);
  }

  public writeToJSON(filename: string): void {
    console.log(this.accounts);
    fs.writeFileSync(filename, JSON.stringify(this.accounts, null, 2));
  }

  public loadFromJSON(filename: string): void {
    const results = fs.readFileSync(filename);
    this.accounts = JSON.parse(results.toString());
  }

  public async loadFromCSV(filename: string): Promise<void> {
    const accounts = await this.parseCSV(filename);
    for (let index = 0; index < accounts.length; index++) {
      if (!accounts[index].Status) {
        accounts[index].Status = AccountStatus.NONE;
      }
      if (!accounts[index].Account) {
        accounts[index].Account = '';
      }
    }
  }

  private async parseCSV(filename: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('error', (err: Error) => reject(err))
        .on('end', () => resolve(results));      
    });
  }
}
