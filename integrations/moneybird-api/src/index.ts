import { getContacts, getContact, getLedgerAccounts, getTaxRates, getDocumentStyles, getWorkflows, createSalesInvoice, createPurchaseInvoice, updatePurchaseInvoice, getPurchaseInvoiceDocument } from './endpoints';
import { mapSalesInvoiceData, mapPurchaseInvoiceData } from './functions';
import * as ife from './interface';
import { authFields } from './interface';

const moneybirdWebAddon = {
    name: 'moneybird-api',
    name_friendly: 'Moneybird API',
    version: '1.0.3',
    type: 'integration',
    auth_fields: authFields,
    init() {
      return {
        getContacts,
        getContact,
        getLedgerAccounts,
        getTaxRates,
        getDocumentStyles,
        getWorkflows,
        createSalesInvoice,
        getPurchaseInvoiceDocument,
        createPurchaseInvoice,
        updatePurchaseInvoice,
        mapSalesInvoiceData,
        mapPurchaseInvoiceData
      };
    }
  };
  
  export type { ife };
  export default moneybirdWebAddon;
