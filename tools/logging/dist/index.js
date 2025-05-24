import { sndMsgConsole, sndMsgApi, sndMsgSlack } from './functions';
const fedexWebAddon = {
    name: 'logging',
    name_friendly: 'Logging library',
    version: '1.0.0',
    init() {
        return {
            sndMsgConsole,
            sndMsgApi,
            sndMsgSlack
        };
    }
};
export default fedexWebAddon;
