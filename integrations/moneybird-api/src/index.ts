import { getContacts, getContact, getLedgerAccounts, getTaxRates, getDocumentStyles, getWorkflows, createSalesInvoice, createPurchaseInvoice, updatePurchaseInvoice, getPurchaseInvoiceDocument } from './endpoints';
import { mapInvoiceData } from './functions';
const moneybirdWebAddon = {
    name: 'moneybird-api',
    name_friendly: 'Moneybird API',
    version: '1.0.0',
    type: 'integration',
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
  
  export default moneybirdWebAddon;
