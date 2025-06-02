// __tests__/db.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

import {
  dbAuth,
  dbCreate,
  dbRead,
  dbUpdate,
  dbDelete,
} from '../src/endpoints';
import type { funcResponse } from '../src/interface';

let mongod: MongoMemoryServer;
let uri: string;

// Constants for database & collection names
const TEST_DB = 'testdb';
const TEST_COL = 'testcol';

beforeAll(async () => {
  // 1) Start an in‐memory MongoDB server before any tests run
  mongod = await MongoMemoryServer.create();
  uri = mongod.getUri();
});

afterAll(async () => {
  // 4) Stop the in‐memory server after all tests finish
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  // Before each test, clear out the test collection so each test starts fresh
  const cleanupClient: MongoClient = dbAuth(uri);
  await cleanupClient.connect();
  await cleanupClient.db(TEST_DB).collection(TEST_COL).deleteMany({});
  await cleanupClient.close();
});

describe('MongoDB CRUD helpers', () => {
  it('dbAuth() returns a MongoClient instance', () => {
    const client = dbAuth(uri);
    expect(client).toBeInstanceOf(MongoClient);
    // (We do not call connect here; this only verifies that dbAuth constructs a client.)
  });

  it('dbCreate() inserts a document and returns its ObjectId', async () => {
    // Use a fresh client for dbCreate:
    const client = dbAuth(uri);
    const payload = { name: 'Alice', age: 30 };

    const res: funcResponse = await dbCreate(client, TEST_DB, TEST_COL, payload);
    expect(res.status).toBe('OK');
    expect(res.data).toBeInstanceOf(ObjectId);

    // Verify the document truly exists in the collection:
    const verifyClient = dbAuth(uri);
    await verifyClient.connect();
    const docs = await verifyClient
      .db(TEST_DB)
      .collection(TEST_COL)
      .find({ _id: res.data })
      .toArray();
    await verifyClient.close();

    expect(docs.length).toBe(1);
    expect(docs[0].name).toBe('Alice');
    expect(docs[0].age).toBe(30);
  });

  it('dbRead() returns an array of matching documents', async () => {
    // Insert two different documents, each with their own client
    const docA = { category: 'fruit', item: 'apple' };
    const docB = { category: 'fruit', item: 'banana' };

    // Use distinct client instances for each insert:
    await dbCreate(dbAuth(uri), TEST_DB, TEST_COL, docA);
    await dbCreate(dbAuth(uri), TEST_DB, TEST_COL, docB);

    // Now read all documents where { category: 'fruit' }
    const readClient = dbAuth(uri);
    const res: funcResponse = await dbRead(readClient, TEST_DB, TEST_COL, { category: 'fruit' });

    expect(res.status).toBe('OK');
    expect(Array.isArray(res.data)).toBe(true);

    const dataArray = res.data as any[];
    // We inserted two “fruit” documents, so length should be 2
    expect(dataArray.length).toBe(2);

    const items = dataArray.map((doc) => doc.item).sort();
    expect(items).toEqual(['apple', 'banana']);
  });

  it('dbUpdate() updates a matching document and returns upsertedId when using upsert', async () => {
    // 1) Insert a document
    await dbCreate(dbAuth(uri), TEST_DB, TEST_COL, { username: 'bob', points: 5 });

    // 2) Update “points” to 10 for username='bob'
    const updateClient = dbAuth(uri);
    const updateRes: funcResponse = await dbUpdate(
      updateClient,
      TEST_DB,
      TEST_COL,
      { username: 'bob' },
      { $set: { points: 10 } }
    );
    expect(updateRes.status).toBe('OK');
    // Our helper does not specify { upsert: true }, so upsertedId should be null/undefined
    expect(updateRes.data == null).toBe(true);

    // 3) Verify that the document was updated
    const verifyClient = dbAuth(uri);
    const readRes: funcResponse = await dbRead(verifyClient, TEST_DB, TEST_COL, { username: 'bob' });
    expect(readRes.status).toBe('OK');
    const docs = readRes.data as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].points).toBe(10);

    // 4) Manually perform an upsert (bypassing our helper) to confirm upsert behavior
    const upsertClient = dbAuth(uri);
    await upsertClient.connect();
    const coll = upsertClient.db(TEST_DB).collection(TEST_COL);
    const upsertResult = await coll.updateOne(
      { username: 'charlie' },
      { $set: { points: 7 } },
      { upsert: true }
    );
    await upsertClient.close();

    expect(upsertResult.upsertedId).toBeDefined();

    // Verify “charlie” now exists
    const verifyUpsertClient = dbAuth(uri);
    const findRes = await dbRead(verifyUpsertClient, TEST_DB, TEST_COL, { username: 'charlie' });
    expect(findRes.status).toBe('OK');
    expect((findRes.data as any[])[0].points).toBe(7);
  });

  it('dbDelete() removes a matching document and returns deletedCount = 1', async () => {
    // 1) Insert two documents, each with its own client
    await dbCreate(dbAuth(uri), TEST_DB, TEST_COL, { tag: 'temp', value: 1 });
    await dbCreate(dbAuth(uri), TEST_DB, TEST_COL, { tag: 'permanent', value: 2 });

    // 2) Delete only { tag: 'temp' }
    const deleteClient = dbAuth(uri);
    const deleteRes: funcResponse = await dbDelete(deleteClient, TEST_DB, TEST_COL, { tag: 'temp' });
    expect(deleteRes.status).toBe('OK');
    expect(deleteRes.data).toBe(1); // exactly one document removed

    // 3) Verify that “temp” is gone but “permanent” remains
    const verifyClient = dbAuth(uri);
    const readAll: funcResponse = await dbRead(verifyClient, TEST_DB, TEST_COL, {});
    expect(readAll.status).toBe('OK');
    const remainingDocs = readAll.data as any[];
    expect(remainingDocs.length).toBe(1);
    expect(remainingDocs[0].tag).toBe('permanent');
  });

  it('dbCreate/dbRead/dbUpdate/dbDelete all return status="ERROR" when given an invalid client URI', async () => {
    // Create a MongoClient pointing at localhost:1 (unused port),
    // with a short serverSelectionTimeoutMS so it fails quickly.
    const badClient = new MongoClient('mongodb://127.0.0.1:1', {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      serverSelectionTimeoutMS: 100, // 100 ms → fail quickly
    });

    // 1) dbCreate
    const cRes = await dbCreate(badClient, TEST_DB, TEST_COL, { foo: 'bar' });
    expect(cRes.status).toBe('ERROR');

    // 2) dbRead
    const rRes = await dbRead(badClient, TEST_DB, TEST_COL, {});
    expect(rRes.status).toBe('ERROR');

    // 3) dbUpdate
    const uRes = await dbUpdate(badClient, TEST_DB, TEST_COL, { foo: 'bar' }, { $set: { baz: 1 } });
    expect(uRes.status).toBe('ERROR');

    // 4) dbDelete
    const dRes = await dbDelete(badClient, TEST_DB, TEST_COL, { foo: 'bar' });
    expect(dRes.status).toBe('ERROR');

    // The helper functions catch any connection errors so none of these throws.
  });
});
