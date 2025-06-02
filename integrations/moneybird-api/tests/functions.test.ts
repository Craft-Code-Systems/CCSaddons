import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapPurchaseInvoiceData,
  mapTaxRate,
  mapLedgerAccount
} from '../src/functions';
import * as endpoints from '../src/endpoints';
import * as ife from '../src/interface';

// --- Tests for mapPurchaseInvoiceData ---
describe('mapPurchaseInvoiceData', () => {
  const dummyId = 'admin123';
  const dummyToken = 'tokenABC';
  const dummyAuthFields: ife.AuthFields = { administration_id: dummyId, token: dummyToken };

  // Reset all mocks between tests
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('maps purchase invoice data successfully when taxed=false', async () => {
    // 1) Mock getContact to return a valid contact ID
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({
      status: 'OK',
      data: [{ id: 'CID_PURCHASE' }]
    });

    // 2) Mock getTaxRates to return an array with a tax rate that matches item_tax_rate and invoice_type
    vi.spyOn(endpoints, 'getTaxRates').mockResolvedValue({
      status: 'OK',
      data: [
        { id: 'PT1', name: 'Purchase Tax 5%', tax_rate_type: 'purchase' }
      ] as any
    });

    // 3) Mock getLedgerAccounts to return an array with a ledger account whose name includes the requestedLedgerAccount
    vi.spyOn(endpoints, 'getLedgerAccounts').mockResolvedValue({
      status: 'OK',
      data: [
        { id: 'PL1', name: 'Purchase Ledger Main' }
      ] as any
    });

    // Define a sample ccsPurchaseInvoice payload
    const invoiceData = {
      invoice_from: 'Vendor Inc',
      invoice_date: '2025-05-20',
      invoice_due_date: '2025-06-20',
      invoice_reference: 'P-INV-100',
      invoice_type: 'purchase',
      invoice_items: [
        {
          item_description: 'PurchaseItem1',
          item_quantity: 3,
          item_price: 50,
          item_tax_rate: 'Purchase Tax 5%',      // must match name.includes
          item_ledger_account: 'Purchase Ledger' // must match name.includes
        }
      ]
    } as any as ife.ccsPurchaseInvoice;

    // Call the function under test
    const result = await mapPurchaseInvoiceData(
      invoiceData,
      dummyAuthFields,
      /* taxed= */ false
    );

    // Expect a successful response
    expect(result.status).toBe('OK');
    expect(result.data).toMatchObject({
      administration_id: dummyId,
      contact_id: 'CID_PURCHASE',
      // convertInvoiceDate('2025-05-20') → '2025-05-20'
      date: '2025-05-20',
      // convertInvoiceDate('2025-06-20') → '2025-06-20'
      due_date: '2025-06-20',
      reference: 'P-INV-100',
      prices_are_incl_tax: false,
      details_attributes: [
        {
          description: 'PurchaseItem1',
          amount: 3,
          price: 50,
          tax_rate_id: 'PT1',
          ledger_account_id: 'PL1'
        }
      ]
    });
  });

  it('maps purchase invoice data successfully when taxed=true', async () => {
    // Similar to the previous test but with taxed = true,
    // to verify that the flag is passed through correctly.
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({
      status: 'OK',
      data: [{ id: 'CID_PURCHASE2' }]
    });
    vi.spyOn(endpoints, 'getTaxRates').mockResolvedValue({
      status: 'OK',
      data: [
        { id: 'PT2', name: 'Purchase Tax 10%', tax_rate_type: 'purchase' }
      ] as any
    });
    vi.spyOn(endpoints, 'getLedgerAccounts').mockResolvedValue({
      status: 'OK',
      data: [
        { id: 'PL2', name: 'Purchase Ledger Secondary' }
      ] as any
    });

    const invoiceData = {
      invoice_from: 'VendorCorp',
      invoice_date: '2025-07-01',
      invoice_due_date: '2025-08-01',
      invoice_reference: 'P-INV-200',
      invoice_type: 'purchase',
      invoice_items: [
        {
          item_description: 'PurchaseItemX',
          item_quantity: 5,
          item_price: 20,
          item_tax_rate: 'Purchase Tax 10%',
          item_ledger_account: 'Ledger Secondary'
        }
      ]
    } as any as ife.ccsPurchaseInvoice;

    const result = await mapPurchaseInvoiceData(
      invoiceData,
      dummyAuthFields,
      /* taxed= */ true
    );

    expect(result.status).toBe('OK');
    expect(result.data).toMatchObject({
      administration_id: dummyId,
      contact_id: 'CID_PURCHASE2',
      date: '2025-07-01',
      due_date: '2025-08-01',
      reference: 'P-INV-200',
      prices_are_incl_tax: true,
      details_attributes: [
        {
          description: 'PurchaseItemX',
          amount: 5,
          price: 20,
          tax_rate_id: 'PT2',
          ledger_account_id: 'PL2'
        }
      ]
    });
  });

  it('returns error if getContact fails', async () => {
    // Simulate getContact returning an ERROR response
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({
      status: 'ERROR',
      error: 'no contact'
    });

    const invoiceData = {
      invoice_from: 'NonExistentVendor',
      invoice_date: '2025-09-10',
      invoice_due_date: '2025-10-10',
      invoice_reference: 'P-INV-300',
      invoice_type: 'purchase',
      invoice_items: []
    } as any as ife.ccsPurchaseInvoice;

    const result = await mapPurchaseInvoiceData(
      invoiceData,
      dummyAuthFields,
      /* taxed= */ false
    );

    expect(result.status).toBe('ERROR');
    expect((result.error as string)).toMatch(
      /Contact ID not found for company: NonExistentVendor/
    );
  });

  it('returns error if getTaxRates fails', async () => {
    // 1) getContact succeeds
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({
      status: 'OK',
      data: [{ id: 'CID_OK' }]
    });
    // 2) getTaxRates returns ERROR
    vi.spyOn(endpoints, 'getTaxRates').mockResolvedValue({
      status: 'ERROR',
      error: 'tax rates missing'
    });

    const invoiceData = {
      invoice_from: 'SomeVendor',
      invoice_date: '2025-11-01',
      invoice_due_date: '2025-12-01',
      invoice_reference: 'P-INV-400',
      invoice_type: 'purchase',
      invoice_items: []
    } as any as ife.ccsPurchaseInvoice;

    const result = await mapPurchaseInvoiceData(
      invoiceData,
      dummyAuthFields,
      /* taxed= */ false
    );

    expect(result.status).toBe('ERROR');
    expect((result.error as string)).toMatch(/Tax rate ID not found/);
  });

  it('returns error if getLedgerAccounts fails', async () => {
    // 1) getContact succeeds
    vi.spyOn(endpoints, 'getContact').mockResolvedValue({
      status: 'OK',
      data: [{ id: 'CID_OK2' }]
    });
    // 2) getTaxRates succeeds
    vi.spyOn(endpoints, 'getTaxRates').mockResolvedValue({
      status: 'OK',
      data: [
        { id: 'PTX', name: 'Purchase Tax X%', tax_rate_type: 'purchase' }
      ] as any
    });
    // 3) getLedgerAccounts returns ERROR
    vi.spyOn(endpoints, 'getLedgerAccounts').mockResolvedValue({
      status: 'ERROR',
      error: 'no ledger accounts'
    });

    const invoiceData = {
      invoice_from: 'AnotherVendor',
      invoice_date: '2025-02-14',
      invoice_due_date: '2025-03-14',
      invoice_reference: 'P-INV-500',
      invoice_type: 'purchase',
      invoice_items: []
    } as any as ife.ccsPurchaseInvoice;

    const result = await mapPurchaseInvoiceData(
      invoiceData,
      dummyAuthFields,
      /* taxed= */ false
    );

    expect(result.status).toBe('ERROR');
    expect((result.error as string)).toMatch(/Ledger account ID not found/);
  });
});

// --- Tests for helper functions used by mapPurchaseInvoiceData ---
// (optional, but good to include in case you want to verify mapTaxRate/mapLedgerAccount/convertInvoiceDate in isolation)

describe('mapTaxRate (purchase context)', () => {
  it('returns matching id when name and type match', () => {
    const rates = [
      { id: 'P1', name: 'Purchase Tax 21%', tax_rate_type: 'purchase' },
      { id: 'S1', name: 'Sales Tax 9%', tax_rate_type: 'sales' }
    ] as any as ife.moneybirdTaxRates[];
    const result = mapTaxRate(rates, 'Purchase Tax 21%', 'purchase');
    expect(result).toBe('P1');
  });

  it('returns empty string when no match', () => {
    const rates: ife.moneybirdTaxRates[] = [];
    expect(mapTaxRate(rates, 'Whatever', 'purchase')).toBe('');
  });
});

describe('mapLedgerAccount (purchase context)', () => {
  it('returns matching id when name includes requested ledger', () => {
    const accounts = [
      { id: 'PLD1', name: 'Purchase Ledger Department' },
      { id: 'SLD1', name: 'Sales Ledger Department' }
    ] as any as ife.moneybirdLedgerAccounts[];
    expect(mapLedgerAccount(accounts, 'Purchase Ledger')).toBe('PLD1');
  });

  it('returns empty string when no match', () => {
    const accounts: ife.moneybirdLedgerAccounts[] = [];
    expect(mapLedgerAccount(accounts, 'Nonexistent')).toBe('');
  });
});

