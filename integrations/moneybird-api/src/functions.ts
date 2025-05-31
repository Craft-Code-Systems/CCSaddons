import * as ife from './interface';
import { getContact, getWorkflow, getTaxRates, getLedgerAccounts } from './endpoints';

export async function mapSalesInvoiceData(invoiceData: ife.ccsSalesInvoice, moneybirdToken: string, moneybirdId: string): Promise<ife.funcResponse> {
    try{
        const contactResponse = await getContact(`query=${invoiceData.invoice_client_company}`, moneybirdId, moneybirdToken);
        if (contactResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Contact ID not found for company: ' + invoiceData.invoice_client_company};
        }
        const contact_id: string = contactResponse.data![0].id;

        const workflowResponse = await getWorkflow(`query=${invoiceData.invoice_client_billing_period}`, moneybirdId, moneybirdToken);
        if (workflowResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Workflow ID not found for billing period: ' + invoiceData.invoice_client_billing_period};
        }
        const workflow_id: number = workflowResponse.data![0].id;

        const taxRatesResponse = await getTaxRates(undefined, moneybirdId, moneybirdToken);
        if (taxRatesResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Tax rate ID not found'};
        }
        const taxRates = taxRatesResponse.data?.map((taxRate: any) => taxRate as ife.moneybirdTaxRates);

        const ledgerAccountsResponse = await getLedgerAccounts(undefined, moneybirdId, moneybirdToken);
        if (ledgerAccountsResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Ledger account ID not found'};
        }
        const ledgerAccounts = ledgerAccountsResponse.data?.map((ledgerAccount: any) => ledgerAccount as ife.moneybirdLedgerAccounts);


    const mapped_data: ife.moneybirdSalesInvoiceData = {
        administration_id: moneybirdId,
        contact_id: contact_id,
        // document_style_id: invoiceData.document_style_id,
        workflow_id: workflow_id,
        invoice_date: invoiceData.invoice_date,
        reference: invoiceData.invoice_reference,
        prices_are_incl_tax: false,
        details_attributes: invoiceData.invoice_items.map((item: ife.ccsInvoiceItems) => ({
            description: item.item_description,
            amount: item.item_quantity,
            price: item.item_price,
            tax_rate_id: mapTaxRate(taxRates ? taxRates : [], item.item_tax_rate, invoiceData.invoice_type),
            ledger_account_id: mapLedgerAccount(ledgerAccounts ? ledgerAccounts : [], item.item_ledger_account)
        }))
    };
    return {status: 'OK', data: mapped_data};
} catch (error: any) {
    return {status: 'ERROR', error: error.message};
}
}


export async function mapPurchaseInvoiceData(invoiceData: ife.ccsPurchaseInvoice, moneybirdToken: string, moneybirdId: string, taxed: boolean): Promise<ife.funcResponse> {
    try{
        const contactResponse = await getContact(`query=${invoiceData.invoice_from}`, moneybirdId, moneybirdToken);
        if (contactResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Contact ID not found for company: ' + invoiceData.invoice_from};
        }
        const contact_id: string = contactResponse.data![0].id;

        const taxRatesResponse = await getTaxRates(undefined, moneybirdId, moneybirdToken);
        if (taxRatesResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Tax rate ID not found'};
        }
        const taxRates = taxRatesResponse.data?.map((taxRate: any) => taxRate as ife.moneybirdTaxRates);

        const ledgerAccountsResponse = await getLedgerAccounts(undefined, moneybirdId, moneybirdToken);
        if (ledgerAccountsResponse.status === 'ERROR') {
            return {status: 'ERROR', error: 'Ledger account ID not found'};
        }
        const ledgerAccounts = ledgerAccountsResponse.data?.map((ledgerAccount: any) => ledgerAccount as ife.moneybirdLedgerAccounts);


    const mapped_data: ife.moneybirdPurchaseInvoiceData = {
        administration_id: moneybirdId,
        contact_id: contact_id,
        // document_style_id: invoiceData.document_style_id,
        date: convertInvoiceDate(invoiceData.invoice_date),
        due_date: convertInvoiceDate(invoiceData.invoice_due_date),
        reference: invoiceData.invoice_reference,
        prices_are_incl_tax: taxed,
        details_attributes: invoiceData.invoice_items.map((item: ife.ccsInvoiceItems) => ({
            description: item.item_description,
            amount: item.item_quantity,
            price: item.item_price,
            tax_rate_id: mapTaxRate(taxRates ? taxRates : [], item.item_tax_rate, invoiceData.invoice_type),
            ledger_account_id: mapLedgerAccount(ledgerAccounts ? ledgerAccounts : [], item.item_ledger_account)
        }))
    };
    return {status: 'OK', data: mapped_data};
} catch (error: any) {
    return {status: 'ERROR', error: error.message};
}
}


export function mapTaxRate(taxRates: ife.moneybirdTaxRates[], requestedTaxRate: string, invoiceType: string): string {
    const taxRate = taxRates.find((taxRate: ife.moneybirdTaxRates) => taxRate.name.includes(requestedTaxRate) && taxRate.tax_rate_type.includes(invoiceType));
    if (!taxRate) {
        return "";
    }
    return taxRate.id;
}

export function mapLedgerAccount(ledgerAccounts: ife.moneybirdLedgerAccounts[], requestedLedgerAccount: string): string {
    const ledgerAccount = ledgerAccounts.find((ledgerAccount: ife.moneybirdLedgerAccounts) => ledgerAccount.name.includes(requestedLedgerAccount));
    if (!ledgerAccount) {
        return "";
    }
    return ledgerAccount.id;
}

//Function for converting the given invoice date (01-jan-2025) for example to the following format: 2025-05-29
export function convertInvoiceDate(invoiceDate: string): string {
    const date = new Date(invoiceDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}