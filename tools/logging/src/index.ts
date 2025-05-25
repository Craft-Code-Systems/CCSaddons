import { sndMsgConsole, sndMsgApi, sndMsgSlack } from './functions';

const loggingAddon = {
    name: 'logging',
    name_friendly: 'Logging library',
    version: '1.0.3',
    type: 'tooling',
    init() {
      return {
        sndMsgConsole,
        sndMsgApi,
        sndMsgSlack
      };
    }
  };
  
  export default loggingAddon;
