import csv from 'csv-parser';
import * as fs from 'fs';

export class CSVReader {
  constructor(private filename: string){}

  public async parse(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(this.filename)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('error', (err: Error) => reject(err))
        .on('end', () => resolve(results));      
    });
  }
}
