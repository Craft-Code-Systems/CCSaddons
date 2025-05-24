import { sndMsgConsole, sndMsgApi, sndMsgSlack } from './functions';
declare const fedexWebAddon: {
    name: string;
    name_friendly: string;
    version: string;
    init(): {
        sndMsgConsole: typeof sndMsgConsole;
        sndMsgApi: typeof sndMsgApi;
        sndMsgSlack: typeof sndMsgSlack;
    };
};
export default fedexWebAddon;
