import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShipCost, getShipInfo, downloadFile, getFileList } from '../src/endpoints'; 
import { fetchWithRetry } from '../src/requests';
import type { auth, shipmentInfo } from '../src/interface';

vi.mock('../src/requests', () => ({
  fetchWithRetry: vi.fn()
}));

const mockAuth: auth = {
  api_bearer_token: '',
  web_bearer_token: 'token',
  api_client_id: '',
  api_client_secret: '',
  web_client_id: 'client-id',
  web_client_username: '',
  web_client_password: '',
  web_client_cookie: 'session=123;',
  web_account_number: '123456789',
  api_bearer_token_expires_at: 0,
  web_transaction_id: 'txid'
};

describe('FedEx API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getShipCost returns shipmentInfo', async () => {
    (fetchWithRetry as any).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        shipments: [{
          originalAmount: { amount: 1234 },
          invoice: 'INV123',
          shipment: 'SHIP123'
        }]
      })
    });

    const result = await getShipCost('TNT123', mockAuth);
    expect(result).toEqual({
      shipment_cost: 1234,
      invoice_id: 'INV123',
      shipmenet_id: 'SHIP123',
      actualWeight: 0,
      ratedWeight: 0,
      customs_cost: 0,
      shipment_tnt: 'TNT123'
    });
  });

  it('getShipInfo returns detailed shipmentInfo', async () => {
    const ship: shipmentInfo = {
      shipment_cost: 1000,
      invoice_id: 'INV1',
      shipmenet_id: 'SHIP1',
      actualWeight: 0,
      ratedWeight: 0,
      customs_cost: 0,
      shipment_tnt: 'TNT1'
    };

    (fetchWithRetry as any).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        shipmentDetail: {
          actualWeight: { weightAmount: 500 },
          ratedweight: { weightAmount: 600 }
        },
        customsInfo: {
          customsValue: { amount: 200 }
        }
      })
    });

    const result = await getShipInfo(ship, mockAuth);
    expect(result).toMatchObject({
      shipment_cost: 1000,
      invoice_id: 'INV1',
      shipmenet_id: 'SHIP1',
      actualWeight: 500,
      ratedWeight: 600,
      customs_cost: 200
    });
  });

  it('downloadFile returns text if successful', async () => {
    (fetchWithRetry as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('PDF_CONTENT')
    });

    const result = await downloadFile('FILE_ID', mockAuth);
    expect(result).toBe('PDF_CONTENT');
  });

  it('getFileList returns report IDs', async () => {
    (fetchWithRetry as any).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        reportDetails: [
          { reportId: 'file1' },
          { reportId: 'file2' }
        ]
      })
    });

    const result = await getFileList(mockAuth);
    expect(result).toEqual(['file1', 'file2']);
  });
});
