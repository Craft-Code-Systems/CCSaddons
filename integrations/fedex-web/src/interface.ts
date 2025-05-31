export interface auth{
    api_bearer_token: string;
    web_bearer_token: string;
    api_client_id: string;
    api_client_secret: string;
    web_client_id: string;
    web_client_username: string;
    web_client_password: string;
    web_client_cookie: string;
    web_account_number: string;
    api_bearer_token_expires_at: number;
    web_transaction_id: string;
}

export interface shipmentInfo{
    shipment_cost: number;
    customs_cost: number;
    invoice_id: string;
    shipmenet_id: string;
    actualWeight: number;
    ratedWeight: number;
    shipment_tnt: string;

}

export const authFields = [
    'web_bearer_token',
    'web_client_id',
    'web_client_username',
    'web_client_password',
    'web_client_cookie',
    'web_account_number',
    'web_transaction_id'
] as const

export type authFields = typeof authFields[number]