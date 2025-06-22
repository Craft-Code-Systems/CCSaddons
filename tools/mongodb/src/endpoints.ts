import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import * as ife from './interface';

export function dbAuth(iru: string): MongoClient {
    const client = new MongoClient(iru, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    return client
}

export async function dbCreate(client: MongoClient, dbName: string, colName: string, data: any): Promise<ife.funcResponse> {
    try {
        let result: ife.funcResponse = {
            status: 'OK',
            data: null,
            error: undefined
        };

        const db = client.db(dbName);
        const collection = db.collection(colName);

        const insertResult = await collection.insertOne(data);
        // Check if the insert was successful
        if (insertResult.acknowledged) {
            result.data = insertResult.insertedId;
        } else {
            result.status = 'ERROR';
            result.error = 'Insert failed witht error: ' + insertResult + ' with data: ' + data;

        }

        return result;
    } catch (error) {
        return {
            status: 'ERROR',
            data: null,
            error: error
        }
    }
}

export async function dbUpdate(client: MongoClient, dbName: string, colName: string, qry: any, data: any): Promise<ife.funcResponse> {
    try {
        let result: ife.funcResponse = {
            status: 'OK',
            data: null,
            error: undefined
        };

        const db = client.db(dbName);
        const collection = db.collection(colName);

        const insertResult = await collection.updateOne(qry, data);
        // Check if the insert was successful
        if (insertResult.acknowledged) {
            result.data = insertResult.upsertedId;
        } else {
            result.status = 'ERROR';
            result.error = 'Insert failed witht error: ' + insertResult + ' with data: ' + data;

        }

        return result;
    } catch (error) {
        return {
            status: 'ERROR',
            data: null,
            error: error
        }
    }
}

export async function dbRead(
  client: MongoClient,
  dbName: string,
  colName: string,
  qry: any,
  pln: any
): Promise<ife.funcResponse> {
  try {
    let result: ife.funcResponse = {
      status: 'OK',
      data: null,
      error: undefined
    };

    const db = client.db(dbName);
    const collection = db.collection(colName);

    let insertResult;
    if (qry) {
      // qry must be a plain JS object, not a string
      insertResult = await collection.find(qry).toArray();
      if (insertResult) {
        result.data = insertResult;
      } else {
        result.status = 'ERROR';
        result.error = 'Find returned no results (qry=' + JSON.stringify(qry) + ')';
      }
    } else {
      // pln must be an Array of pipeline stage objects
      insertResult = await collection.aggregate(pln).toArray();
      if (insertResult) {
        result.data = insertResult;
      } else {
        result.status = 'ERROR';
        result.error = 'Aggregate returned no results (pln=' + JSON.stringify(pln) + ')';
      }
    }
    return result;
  } catch (error) {
    return {
      status: 'ERROR',
      data: null,
      error
    };
  }
}

export async function dbDelete(client: MongoClient, dbName: string, colName: string, qry: any): Promise<ife.funcResponse> {
    try {
        let result: ife.funcResponse = {
            status: 'OK',
            data: null,
            error: undefined
        };
        const db = client.db(dbName);
        const collection = db.collection(colName);

        const insertResult = await collection.deleteOne(qry);
        // Check if the insert was successful
        if (insertResult.acknowledged) {
            result.data = insertResult.deletedCount;
        } else {
            result.status = 'ERROR';
            result.error = 'Insert failed witht error: ' + insertResult + ' with data: ' + qry;

        }

        return result;
    } catch (error) {
        return {
            status: 'ERROR',
            data: null,
            error: error
        }
    }
}   


export async function dbCon(client: MongoClient): Promise<ife.funcResponse> {
    let result: ife.funcResponse = {
        status: 'OK',
        data: null,
        error: undefined
    };
    try {
        await client.connect();
        result.data = 'Connected';
    } catch (error) {
        result.status = 'ERROR';
        result.error = error;
    }
    return result;
}

export async function dbCls(client: MongoClient): Promise<ife.funcResponse> {
    let result: ife.funcResponse = {
        status: 'OK',
        data: null,
        error: undefined
    };
    try {
        await client.close();
        result.data = 'Closed connection';
    } catch (error) {
        result.status = 'ERROR';
        result.error = error;
    }
    return result;
}