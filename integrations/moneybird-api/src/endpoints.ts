import * as ife from './interface';

/**
 * Fetches data from a Moneybird API endpoint.
 * @param endpoint The API endpoint to fetch data from.
 * @param parameters Query string parameters for the API request.
 * @param administrationId The Moneybird administration ID.
 * @param token The Moneybird API token.
 * @param isJson If true, the response is expected to be JSON, otherwise it is expected to be a PDF.
 * @returns The API response or an error object if the response was not OK.
 * @throws Error if the API request failed.
 */
export async function getApiData(endpoint: string, parameters: string, auth_fields: ife.AuthFields, isJson: boolean): Promise<ife.funcResponse> {
    const options: RequestInit = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${auth_fields.token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(`https://moneybird.com/api/v2/${auth_fields.administration_id}/${endpoint}?${parameters}`, options);

        if (!response.ok) {
            return { status: 'ERROR', error: `${response.status} - ${response.statusText}` };
        }

        if (isJson) {
            const data = await response.json();
            return { status: 'OK', data };
        } else if (response.headers.get('Content-Type') === 'application/pdf') {
            const data = await response.arrayBuffer();
            return { status: 'OK', data };
        } else {
            return { status: 'ERROR', error: `Unexpected Content-Type: ${response.headers.get('Content-Type')}` };
        }

    } catch (error) {
        return { status: 'ERROR', error: `${error}` };
    }
}


/**
 * Posts data to a Moneybird API endpoint.
 * @param endpoint The API endpoint to post data to.
 * @param data The data to post in the request body.
 * @param administrationId The Moneybird administration ID.
 * @param token The Moneybird API token.
 * @returns The API response or an error object if the response was not OK.
 * @throws Error if the API request failed.
 */
export async function postApiData(endpoint: string, data: object, auth_fields: ife.AuthFields): Promise<ife.funcResponse> {
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth_fields.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    
    try {
        const response: Response = await fetch(`https://moneybird.com/api/v2/${auth_fields.administration_id}/${endpoint}`, requestOptions);

        if (!response.ok || ![200, 201, 202].includes(response.status)) {
            return { status: "ERROR", error: `${response.status} - ${response.statusText}` };
        }

        const responseData = await response.json();
        return { status: "OK", data: responseData };

    } catch (error: any) {
        return { status: 'ERROR', error: `${error}` };
    }
}

/**
 * Posts data to a Moneybird API endpoint.
 * @param endpoint The API endpoint to post data to.
 * @param data The data to post in the request body.
 * @param administrationId The Moneybird administration ID.
 * @param token The Moneybird API token.
 * @returns The API response or an error object if the response was not OK.
 */
export async function patchApiData(endpoint: string, data: object, auth_fields: ife.AuthFields): Promise<ife.funcResponse> {
    const requestOptions: RequestInit = {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${auth_fields.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value // Convert BigInt to string
        )
    };

    try {
        const response: Response = await fetch(`https://moneybird.com/api/v2/${auth_fields.administration_id}/${endpoint}`, requestOptions);

        if (!response.ok || ![200, 201, 202].includes(response.status)) {
            return { status: "ERROR", error: `${response.status} - ${response.statusText}` };
        }

        const responseData = await response.json();
        return { status: "OK", data: responseData };

    } catch (error: any) {
        return { status: 'ERROR', error: `${error}` };
    }
}


// Define the HTTP methods supported
export type Method = 'get' | 'post' | 'patch';

// Core helper that handles all Moneybird API calls
export async function moneybirdRequest<T>(
    method: Method,
    endpoint: string,
    auth_fields: ife.AuthFields,
    options?: {
        query?: string;
        genericFlag?: boolean;
        body?: any;
    }
): Promise<ife.funcResponse<T>> {
    let response: ife.funcResponse;

    switch (method) {
        case 'get':
            response = await getApiData(
                endpoint,
                options?.query ?? '',
                auth_fields,
                !!options?.genericFlag
            );
            break;
        case 'post':
            response = await postApiData(
                endpoint,
                options?.body,
                auth_fields
            );
            break;
        case 'patch':
            response = await patchApiData(
                endpoint,
                options?.body,
                auth_fields
            );
            break;
    }

    if (response.status === 'ERROR') {
        return { status: 'ERROR', error: response.error };
    }

    return { status: 'OK', data: response.data as T };
}

// Factory to generate Moneybird functions
export function makeMoneybirdFunction<
    TIn = void,
    TOut = any
>(
    method: Method,
    endpointTemplate: string,
    genericFlag = false
) {
    return async (
        payload: TIn extends void ? undefined : TIn,
        auth_fields: ife.AuthFields
    ): Promise<ife.funcResponse<TOut>> => {
        const options: any = { genericFlag };
        let endpoint = endpointTemplate;

        // Handle GET query string
        if (method === 'get' && typeof payload === 'string') {
            options.query = payload;
        }

        // Handle POST/PATCH body shape
        if ((method === 'post' || method === 'patch') && payload) {
            const bodyKey = endpoint.includes('sales_invoices')
                ? 'sales_invoice'
                : endpoint.includes('purchase_invoices')
                    ? 'purchase_invoice'
                    : undefined;

            options.body = bodyKey
                ? { [bodyKey]: payload }
                : payload;
        }

        // Replace :id placeholder if present
        if (payload && (payload as any).id) {
            endpoint = endpoint.replace(':id', (payload as any).id);
        }

        // dynamic import to ensure spies on moneybirdRequest are used
        const module = await import('./endpoints');
        return module.moneybirdRequest<TOut>(
            method,
            endpoint,
            auth_fields,
            options
        );
    };
}

// --- Usage examples ---

// TaxRate, Contact, etc. are your domain types
export interface TaxRate { /* ... */ }
export interface Contact { id: string; /* ... */ }
export interface PurchaseInvoiceData { id?: string; /* ... */ }
export interface PurchaseInvoice { /* ... */ }
export interface SalesInvoiceData { /* ... */ }
export interface SalesInvoice { /* ... */ }

// Instantiate the endpoint functions
export const getTaxRates = makeMoneybirdFunction<void, TaxRate[]>(
    'get',
    'tax_rates.json',
    true
);

export const getContacts = makeMoneybirdFunction<void, Contact[]>(
    'get',
    'contacts.json',
    true
);

export const getContact = makeMoneybirdFunction<string, Contact[]>(
    'get',
    'contacts.json',
    true
);

export const getWorkflow = makeMoneybirdFunction<string, any[]>(
    'get',
    'workflows.json',
    true
)

export const createPurchaseInvoice = makeMoneybirdFunction<
    PurchaseInvoiceData,
    PurchaseInvoice
>(
    'post',
    'documents/purchase_invoices.json'
);

export const updatePurchaseInvoice = makeMoneybirdFunction<
    PurchaseInvoiceData,
    PurchaseInvoice
>(
    'patch',
    'documents/purchase_invoices/:id.json'
);

export const createSalesInvoice = makeMoneybirdFunction<
    SalesInvoiceData,
    SalesInvoice
>(
    'post',
    'documents/sales_invoices.json'
);

export const getPurchaseInvoiceDocument = makeMoneybirdFunction<
    string,
    PurchaseInvoice
>(
    'get',
    'documents/purchase_invoices/:id.json'
);

export const getSalesInvoiceDocument = makeMoneybirdFunction<
    string,
    SalesInvoice
>(
    'get',
    'documents/sales_invoices/:id.json'
);

export const getLedgerAccounts = makeMoneybirdFunction<void, any[]>(
    'get',
    'ledger_accounts.json',
    true
);

export const getWorkflows = makeMoneybirdFunction<void, any[]>(
    'get',
    'workflows.json',
    true
);

export const getDocumentStyles = makeMoneybirdFunction<void, any[]>(
    'get',
    'document_styles.json',
    true
);

