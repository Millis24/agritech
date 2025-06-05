import { getDB } from './indexedDb';
import type { Cliente } from '../components/addClienteDialog';

const STORE_NAME = 'clienti';
const DELETED_STORE_NAME = 'clientiEliminati';

export async function getAllClienti(): Promise<Cliente[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveCliente(cliente: Cliente) {
  const db = await getDB();
  await db.put('clienti', { ...cliente, synced: false });
}

export async function deleteCliente(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function clearClienti() {
  const db = await getDB();
  return db.clear(STORE_NAME);
}

// Eliminazioni offline
export async function markClienteAsDeleted(id: number) {
  const db = await getDB();
  await db.put(DELETED_STORE_NAME, { id });
  await db.delete(STORE_NAME, id);
}

export async function getClientiEliminati(): Promise<{ id: number }[]> {
  const db = await getDB();
  return await db.getAll(DELETED_STORE_NAME);
}

export async function clearClientiEliminati() {
  const db = await getDB();
    await db.clear(DELETED_STORE_NAME);
}