import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapTaxRate, mapLedgerAccount, mapInvoiceData } from '../src/functions';
import * as endpoints from '../src/endpoints';
import * as ife from '../src/interface';

// --- Tests for mapTaxRate ---
describe('mapTaxRate', () => {
  it('returns matching id when name and type match', () => {
    const rates = [
      { id: '1', name: 'VAT 21%', tax_rate_type: 'sales' },
      { id: '2', name: 'VAT 9%', tax_rate_type: 'purchase' }
    ] as any as ife.moneybirdTaxRates[];
    const result = mapTaxRate(rates, 'VAT 21', 'sales');
    expect(result).toBe('1');
  });

  it('returns empty string when no match', () => {
    const rates: ife.moneybirdTaxRates[] = [];
    expect(mapTaxRate(rates, 'X', 'sales')).toBe('');
  });
});

// --- Tests for mapLedgerAccount ---
describe('mapLedgerAccount', () => {
  it('returns matching id when name matches', () => {
    const accounts = [
      { id: 'A1', name: 'Sales Account' },
      { id: 'A2', name: 'Purchase Account' }
    ] as any as ife.moneybirdLedgerAccounts[];
    expect(mapLedgerAccount(accounts, 'Sales')).toBe('A1');
  });

  it('returns empty string when no match', () => {
    const accounts: ife.moneybirdLedgerAccounts[] = [];
    expect(mapLedgerAccount(accounts, 'X')).toBe('');
  });
});

// --- Tests for mapInvoiceData ---
describe('mapInvoiceData', () => {
  const dummyToken = 'token';
  const dummyId = 123;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('maps invoice data successfully', async () => {
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({ status: 'OK', data: [{ id: 'CID' }] });
    vi.spyOn(endpoints, 'getWorkflow').mockResolvedValue({ status: 'OK', data: [{ id: 42 }] });
    vi.spyOn(endpoints, 'getTaxRates').mockResolvedValue({ status: 'OK', data: [
      { id: 'T1', name: 'Tax 10%', tax_rate_type: 'sales' }
    ] as any });
    vi.spyOn(endpoints, 'getLedgerAccounts').mockResolvedValue({ status: 'OK', data: [
      { id: 'L1', name: 'Main ledger' }
    ] as any });

    const invoiceData = {
      invoice_client_company: 'Acme',
      invoice_client_billing_period: 'Q1',
      invoice_date: '2025-05-25',
      invoice_reference: 'INV-001',
      invoice_type: 'sales',
      invoice_items: [{
        item_description: 'Item1',
        item_quantity: 2,
        item_price: 100,
        item_tax_rate: 'Tax 10%',
        item_ledger_account: 'Main ledger'
      }]
    } as any as ife.ccsSalesInvoice;

    const result = await mapInvoiceData(invoiceData, dummyToken, dummyId);
    expect(result.status).toBe('OK');
    expect(result.data).toMatchObject({
      administration_id: dummyId,
      contact_id: 'CID',
      workflow_id: 42,
      invoice_date: invoiceData.invoice_date,
      reference: invoiceData.invoice_reference,
      prices_are_incl_tax: false,
      details_attributes: [{
        description: 'Item1',
        amount: 2,
        price: 100,
        tax_rate_id: 'T1',
        ledger_account_id: 'L1'
      }]
    });
  });

  it('returns error if getContact fails', async () => {
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({ status: 'ERROR', error: 'no' });
    const invoiceData = { invoice_client_company: 'X' } as any;
    const result = await mapInvoiceData(invoiceData, 'tok', 1);
    expect(result.status).toBe('ERROR');
    expect(result.error).toMatch(/Contact ID not found/);
  });

  it('returns error if getWorkflow fails', async () => {
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({ status: 'OK', data: [{ id: 'CID' }] });
    vi.spyOn(endpoints, 'getWorkflow').mockResolvedValue({ status: 'ERROR', error: 'no wf' });
    const invoiceData = { invoice_client_company: 'A', invoice_client_billing_period: 'B' } as any;
    const result = await mapInvoiceData(invoiceData, 'tok', 1);
    expect(result.status).toBe('ERROR');
    expect(result.error).toMatch(/Workflow ID not found/);
  });
});
