export interface IConfig {
  issuer: string;
  distributionSecret: string;
  currencyCode: string;
  amount: string;
}

export function getConfig(): IConfig {
  const getOrFail = (envVar: string): string => {
    if (!process.env[envVar]) {
      throw new Error('Environment variable not set: ' + envVar);
    }

    return <string>process.env[envVar];
  };

  const config: IConfig = {
    issuer: getOrFail('ISSUER'),
    distributionSecret: getOrFail('DISTRIBUTION'),
    currencyCode: getOrFail('CODE'),
    amount: getOrFail('AMOUNT')
  };

  console.log(`DISTRIBUTION: ${config.distributionSecret.substr(0, 4)}... CODE: ${config.currencyCode} AMOUNT: ${config.amount} ISSUER: ${config.issuer}`);

  return config;
};
