import { getCookie } from './auth';
import { getShipCost, downloadFile, getFileList, getShipInfo } from './endpoints';
import * as ife from './interface';
import { authFields } from './interface';

const fedexWebAddon = {
    name: 'fedex-web',
    name_friendly: 'FedEx Web Scraper',
    version: '1.0.4',
    type: 'integration',
    sub_type: 'carrier',
    map_version: '0.0.0',
    auth_fields: authFields,
    init() {
      return {
        getCookie,
        getShipCost,
        downloadFile,
        getFileList,
        getShipInfo
      };
    }
  };
  
export type { ife };
export default fedexWebAddon;

