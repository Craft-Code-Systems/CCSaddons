import { getCookie } from './auth';
import { getShipCost, downloadFile, getFileList, getShipInfo } from './endpoints';

const fedexWebAddon = {
    name: 'fedex-web',
    name_friendly: 'FedEx Web Scraper',
    version: '1.0.1',
    type: 'integration',
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
  
  export default fedexWebAddon;
