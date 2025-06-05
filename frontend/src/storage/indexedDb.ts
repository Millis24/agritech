import { openDB, type IDBPDatabase } from 'idb';

export type CRMDatabase = {
  clienti: any;
  imballaggi: any;
  prodotti: any;
  bolle: any;

  prodottiEliminati: any;
  clientiEliminati: any;
  imballaggiEliminati: any;

};

const VERSIONE_DB = 7;

let dbPromise: Promise<IDBPDatabase<CRMDatabase>>;

export function getDB(): Promise<IDBPDatabase<CRMDatabase>> {
  if (!dbPromise) {
    dbPromise = openDB<CRMDatabase>('crm-offline', VERSIONE_DB, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clienti')) {
          db.createObjectStore('clienti', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('imballaggi')) {
          db.createObjectStore('imballaggi', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prodotti')) {
          db.createObjectStore('prodotti', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bolle')) {
          db.createObjectStore('bolle', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prodottiEliminati')) {
          db.createObjectStore('prodottiEliminati', { keyPath: 'id' });
        }
         if (!db.objectStoreNames.contains('clientiEliminati')) {
          db.createObjectStore('clientiEliminati', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('imballaggiEliminati')) {
          db.createObjectStore('imballaggiEliminati', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}