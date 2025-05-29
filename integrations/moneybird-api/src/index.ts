import { getContacts, getContact, getLedgerAccounts, getTaxRates, getDocumentStyles, getWorkflows, createSalesInvoice, createPurchaseInvoice, updatePurchaseInvoice, getPurchaseInvoiceDocument } from './endpoints';
import { mapInvoiceData } from './functions';
import * as ife from './interface';
import { authFields } from './interface';

const moneybirdWebAddon = {
    name: 'moneybird-api',
    name_friendly: 'Moneybird API',
    version: '1.0.2',
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
        mapInvoiceData
      };
    }
  };
  
  export type { ife };
  export default moneybirdWebAddon;
