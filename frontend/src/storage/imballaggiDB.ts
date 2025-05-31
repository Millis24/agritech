// src/storage/imballaggiDB.ts
import { getDB } from './indexedDb';
import type { Imballaggio } from '../components/addImballaggioDialog';

const STORE_NAME = 'imballaggi';

export async function getAllImballaggi(): Promise<Imballaggio[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveImballaggio(imballaggio: Imballaggio) {
  const db = await getDB();
  return db.put(STORE_NAME, imballaggio);
}

export async function deleteImballaggio(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearImballaggi() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}