import { fetchWithRetry } from './requests';
import * as ife from './interface';

/**
 * Gets the cost of a FedEx shipment given its TNT number.
 * @param {string} TNT - The TNT number of the shipment to get the cost for.
 * @param {ife.auth} AUTH - The authentication object containing web bearer token, client cookie, transaction ID, client ID, and account number.
 * @returns {Promise<ife.shipmentInfo | null>} - The cost of the shipment as an object with properties `cost` (the cost in cents), `invoice_id` (the invoice ID), and `shipmenet_id` (the shipment ID), or null if an error occurred.
 * @throws Error if the request fails.
 */
export async function getShipCost(TNT: string, AUTH: ife.auth): Promise<ife.shipmentInfo | null> {
    try {
        const RESPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/shipments/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AUTH.web_bearer_token,
                'Cookie': AUTH.web_client_cookie,
                'X-client-transaction-id': AUTH.web_transaction_id,
                'X-clientid': AUTH.web_client_id
            },
            body: JSON.stringify({
                "accountNumber": AUTH.web_account_number,
                "quickSearchCriteria": {
                    "key": "TRACKING_ID",
                    "value": TNT
                },
                "pageCriteria": {
                    "cursor": 0,
                    "pageSize": 250
                }
            })
        });
        const CONTENT_TYPE = RESPONSE.headers.get('content-type');
        let data: any;
        if (CONTENT_TYPE && CONTENT_TYPE.includes('application/json')) {
            data = await RESPONSE.json();
        } else {
            data = await RESPONSE.text(); // For XML or plain text error responses
        }

        if (!RESPONSE.ok) {
            console.error('Failed to get FedEx ship cost: ' + RESPONSE.statusText + ' (' + RESPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
            return null;
        }
        if (data.shipments === null) return null;
        const SHIP_INFO: ife.shipmentInfo = {
            shipment_cost: data.shipments[0].originalAmount.amount ?? 0,
            invoice_id: data.shipments[0].invoice ?? '',
            shipmenet_id: data.shipments[0].shipment ?? '',
            actualWeight: 0,
            ratedWeight: 0,
            customs_cost: 0,
            shipment_tnt: TNT
        }

        return SHIP_INFO;

    } catch (ERROR: any) {
        console.error("getShipCost - ERROR: ", ERROR);
        return null;
    }
}


/**
 * Gets the cost of a FedEx shipment given its TNT number and invoice ID.
 * @param {string} TNT - The TNT number of the shipment to get the cost for.
 * @param {ife.auth} AUTH - The authentication object containing web bearer token, client cookie, transaction ID, client ID, and account number.
 * @returns {Promise<ife.shipmentInfo | null>} - The cost of the shipment as an object with properties `cost` (the cost in cents), `invoice_id` (the invoice ID), and `shipmenet_id` (the shipment ID), or null if an error occurred.
 * @throws Error if the request fails.
 */
export async function getShipInfo(SHIPMENT: ife.shipmentInfo, AUTH: ife.auth): Promise<ife.shipmentInfo | null> {
    try {
        const REPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/shipments/summaries/retrieve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AUTH.web_bearer_token,
                'Cookie': AUTH.web_client_cookie,
                'X-client-transaction-id': AUTH.web_transaction_id,
                'X-clientid': AUTH.web_client_id
            },
            body: JSON.stringify({
                "accountNumber": AUTH.web_account_number,
                "invoice": SHIPMENT.invoice_id,
                "payerAccountNumber": AUTH.web_account_number,
                "processingOptions": ["DETAILS", "ADDITIONAL_DETAILS", "REFERENCES"], //["BILLING_INFO"]
                "shipment": SHIPMENT.shipmenet_id
            })
        });
        const contentType = REPONSE.headers.get('content-type');
        let data: any;
        if (contentType && contentType.includes('application/json')) {
            data = await REPONSE.json();
        } else {
            data = await REPONSE.text(); // For XML or plain text error responses
        }

        if (!REPONSE.ok) {
            throw new Error('Failed to get FedEx label cost: ' + REPONSE.statusText + ' (' + REPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
        }

        // Check if 'output' exists in the response

        const SHIP_INFO: ife.shipmentInfo = {
            shipment_cost: SHIPMENT.shipment_cost || 0,
            invoice_id: SHIPMENT.invoice_id || '',
            shipmenet_id: SHIPMENT.shipmenet_id || '',
            actualWeight: data.shipmentDetail.actualWeight.weightAmount || 0,
            ratedWeight: data.shipmentDetail.ratedweight.weightAmount || 0,
            customs_cost: data.customsInfo.customsValue.amount || 0,
            shipment_tnt: SHIPMENT.shipment_tnt
        }
        return SHIP_INFO;

    } catch (ERROR: any) {
        console.error("getShipInfo - ERROR: ", ERROR);
        return null;
    }
}

export async function downloadFile(FILE_ID: string, AUTH: ife.auth): Promise<string | null> {
    try {
        const RESPONSE: Response = await fetchWithRetry(
            'https://www.fedex.com/bill/v1/documents/reports/download',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + AUTH.web_bearer_token,
                    'Cookie': AUTH.web_client_cookie,
                    // Note: Both "Cookie" and "cookie" headers are included as in the original code.
                    'cookie': AUTH.web_client_cookie,
                    'X-client-transaction-id': AUTH.web_transaction_id,
                    'X-clientid': AUTH.web_client_id,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-encoding': 'gzip, deflate, br, zstd',
                    'Origin': 'https://www.fedex.com',
                    'Referer': 'https://www.fedex.com/online/billing/cbs/reporting/download-centre',
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Dest': 'empty',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                body: JSON.stringify({
                    accountNumber: AUTH.web_account_number,
                    documentId: FILE_ID,
                }),
            }
        );
        const DATA: string = await RESPONSE.text();

        if (!RESPONSE.ok) {
            console.error(
                'Failed to download FedEx file: ' +
                RESPONSE.statusText +
                ' (' +
                RESPONSE.status +
                ')'
            )
            return null;
        }
        return DATA;
    } catch (ERROR: any) {
        console.error(" downloadFile - ERROR: ", ERROR);
        return null;
    }
}

export async function getFileList(AUTH: ife.auth): Promise<string[] | null> {
    try {
        const RESPONSE: Response = await fetchWithRetry('https://api.fedex.com/bill/v1/reports/retrieve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AUTH.web_bearer_token,
                'Cookie': AUTH.web_client_cookie,
                'X-client-transaction-id': AUTH.web_transaction_id,
                'X-clientid': AUTH.web_client_id,
            },
            body: JSON.stringify({
                accountNumber: AUTH.web_account_number,
            }),
        });
        const CONTENT_TYPE = RESPONSE.headers.get('content-type');
        let data: any;
        if (CONTENT_TYPE && CONTENT_TYPE.includes('application/json')) {
            data = await RESPONSE.json();
        } else {
            data = await RESPONSE.text(); // For XML or plain text error responses
        }

        if (!RESPONSE.ok) {
            console.error('Failed to get FedEx file list: ' + RESPONSE.statusText + ' (' + RESPONSE.status + ')' + ' Info: ' + JSON.stringify(data));
            return null;
        }

        // Check if 'reportDetails' exists in the response
        if (!data.reportDetails || data.reportDetails.length === 0) {
            return null;
        } else {
            const FILE_LIST: string[] = [];
            for (let i = 0; i < data.reportDetails.length; i++) {
                FILE_LIST.push(data.reportDetails[i].reportId);
            }
            return FILE_LIST;
        }
    } catch (ERROR: any) {
        console.error(" getFileList - ERROR: ", ERROR);
        return null;
    }
}