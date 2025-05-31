import { openDB } from 'idb';
import type { Cliente } from '../components/addClienteDialog.tsx';

const DB_NAME = 'crm-offline';
const STORE_NAME = 'clienti';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    }
  });
}

export async function getAllClienti(): Promise<Cliente[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveCliente(cliente: Cliente) {
  const db = await getDB();
  return db.put(STORE_NAME, cliente);
}

export async function deleteCliente(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearClienti() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}