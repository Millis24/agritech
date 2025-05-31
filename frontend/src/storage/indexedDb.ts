// src/storage/indexedDb.ts
import { openDB, type IDBPDatabase } from 'idb';

export type CRMDatabase = {
  clienti: any;
  imballaggi: any;
};

let dbPromise: Promise<IDBPDatabase<CRMDatabase>>;

export function getDB(): Promise<IDBPDatabase<CRMDatabase>> {
  if (!dbPromise) {
    dbPromise = openDB<CRMDatabase>('crm-offline', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clienti')) {
          db.createObjectStore('clienti', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('imballaggi')) {
          db.createObjectStore('imballaggi', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}