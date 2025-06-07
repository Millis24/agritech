import { getDB } from './indexedDb';
//import type { Imballaggio } from '../types';

export type Imballaggio = {
  synced: any;
  id: number;
  tipo: string;
  prezzo: number;
  dimensioni: string;
  capacitaKg: number;
  note?: string;
  createdAt: string;
};

const STORE_NAME = 'imballaggi';
const DELETED_STORE_NAME = 'imballaggiEliminati';

export async function getAllImballaggi(): Promise<Imballaggio[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveImballaggio(imballaggio: Imballaggio) {
  const db = await getDB();
  await db.put('imballaggi', { ...imballaggio, synced: false });
}

export async function deleteImballaggio(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearImballaggi() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}

// Eliminazioni offline
export async function markImballaggiAsDeleted(id: number) {
  const db = await getDB();
  await db.put(DELETED_STORE_NAME, { id });
  await db.delete(STORE_NAME, id);
}

export async function getImballaggiEliminati(): Promise<{ id: number }[]> {
  const db = await getDB();
  return await db.getAll(DELETED_STORE_NAME);
}

export async function clearImballaggiEliminati() {
  const db = await getDB();
    await db.clear(DELETED_STORE_NAME);
}