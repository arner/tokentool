export enum AccountStatus {
    NONE = 0,
    RESOLVED = 1,
    CREATED = 2,
    FUNDED = 3
}

export interface IAccount {
    Tijdstempel: string;
    Name: string;
    'Lobstr account': string;
    Address?: string;
    Status?: AccountStatus;
}
