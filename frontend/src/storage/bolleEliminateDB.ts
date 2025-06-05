import { getDB } from './indexedDb';

const STORE_NAME = 'bolleEliminate';

export async function markBollaAsDeleted(id: number) {
  const db = await getDB();
  return db.put(STORE_NAME, { id });
}

export async function getBolleEliminate(): Promise<{ id: number }[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearBolleEliminate() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}