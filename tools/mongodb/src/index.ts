import { dbCreate, dbUpdate, dbAuth, dbRead, dbDelete, dbCon, dbCls } from './endpoints';
import * as ife from './interface';
import { authFields } from './interface';

const mongodbAddon = {
    name: 'mongodb',
    name_friendly: 'MongoDB',
    version: '1.0.2',
    map_version: '0.0.0',
    type: 'tool',
    sub_type: 'db',
    auth_fields: authFields,
    init() {
      return {
        dbCreate,
        dbUpdate,
        dbAuth,
        dbRead,
        dbDelete,
        dbCon,
        dbCls
      };
    }
  };
  
  export type { ife };
  export default mongodbAddon;
