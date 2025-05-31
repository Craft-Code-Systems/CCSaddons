
export interface funcResponse<T = any> {
    status: 'OK' | 'ERROR';
    data?: T;
    error?: string;
}

export interface moneybirdContact {
    id: string,
    administration_id: string,
    company_name: string,
    email: string,
    firstname: string,
    lastname: string,
    address1: string,
    zipcode: string,
    city: string,
    country: string,
    phone: string,
    tax_number: string,
    chamber_of_commerce: string,
}

export interface moneybirdLedgerAccounts {
    id: string,
    administration_id: string,
    name: string,
    type: string
}

export interface moneybirdTaxRates {
    id: string,
    administration_id: string,
    name: string,
    percentage: string,
    tax_rate_type: string
}

export interface moneybirdWorkflow {
    id: string,
    administration_id: string,
    type: string,
    name: string
}

export interface moneybirdDocumentStyle {
    id: string,
    administration_id: string,
    name: string
}

export interface moneybirdSalesInvoiceData {
    id?: string,
    administration_id: string,
    contact_id: string,
    contact_person_id?: string,
    document_style_id?: number,
    workflow_id?: number,
    invoice_date: string,
    reference: string,
    prices_are_incl_tax: boolean,
    details_attributes: moneybirdInvoiceItems[]
}

export interface moneybirdPurchaseInvoiceData {
    id?: string,
    date: string,
    due_date?: string,
    administration_id: string,
    contact_id: string,
    contact_person_id?: string,
    document_style_id?: number,
    workflow_id?: number,
    invoice_date: string,
    reference: string,
    prices_are_incl_tax: boolean,
    details_attributes: moneybirdInvoiceItems[]
}

export interface moneybirdInvoiceItems {
    price: number,
    tax_rate_id: string,
    ledger_account_id: string,
    description: string,
    amount: number,
    period?: string
}

export interface ccsSalesInvoice {
    invoice_from: string,
    invoice_type: string,
    invoice_client_name: string,
    invoice_client_company: string,
    invoice_client_billing_auto: boolean,
    invoice_client_billing_period: string,
    invoice_reference: string,
    invoice_date: string,
    invoice_items: ccsInvoiceItems[]
}

export interface ccsPurchaseInvoice {
    invoice_from: string,
    invoice_type: string,
    invoice_reference: string,
    invoice_date: string,
    invoice_due_date: string,
    invoice_items: ccsInvoiceItems[]
}

export interface ccsInvoiceItems {
    item_description: string,
    item_quantity: number,
    item_price: number,
    item_period?: string
    item_tax_rate: string
    item_ledger_account: string
}

export const authFields = [
    'administration_id',
    'token'
] as const

export type authFields = typeof authFields[number]