import { getDB } from './indexedDb';

const STORE_NAME = 'clienti';
const DELETED_STORE_NAME = 'clientiEliminati';

export type Cliente = {
  id: number;
  nomeCliente: string;
  ragioneSociale: string;
  partitaIva: string;
  telefono: string;
  email: string;
  createdAt: string;
  synced?: boolean;
};

export async function getAllClienti(): Promise<Cliente[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveCliente(cliente: Cliente) {
  const db = await getDB();
  const data = {
    ...cliente,
    synced: cliente.synced ?? false,
  };
  await db.put('clienti', data);
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
  const rec = await db.get(STORE_NAME, id);
  if (rec?.synced) {
    await db.put(DELETED_STORE_NAME, { id });
  }
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