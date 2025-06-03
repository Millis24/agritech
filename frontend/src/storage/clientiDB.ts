// src/storage/clientiDB.ts
import { getDB } from './indexedDb';
import type { Cliente } from '../components/addClienteDialog';

const STORE_NAME = 'clienti';

export async function getAllClienti(): Promise<Cliente[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveCliente(cliente: Cliente) {
  const db = await getDB();
  await db.put('clienti', { ...cliente, synced: false });
  //return db.put(STORE_NAME, cliente);
}

export async function deleteCliente(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearClienti() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}