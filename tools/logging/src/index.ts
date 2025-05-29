import { sndMsgConsole, sndMsgApi, sndMsgSlack } from './functions';
import * as ife from './interface';
import { authFields } from './interface';

const loggingAddon = {
    name: 'logging',
    name_friendly: 'Logging library',
    version: '1.0.4',
    type: 'tooling',
    auth_fields: authFields,
    init() {
      return {
        sndMsgConsole,
        sndMsgApi,
        sndMsgSlack
      };
    }
  };
  
    export type { ife };
  export default loggingAddon;
