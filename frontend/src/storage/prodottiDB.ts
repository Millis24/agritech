import { getDB } from './indexedDb';

export type Prodotto = {
  id: number;
  nome: string;
  varieta: string;
  calibro: string;
  colore: string;
  createdAt: string;
};

const STORE_NAME = 'prodotti';
const DELETED_STORE_NAME = 'prodottiEliminati';

export async function getAllProdotti(): Promise<Prodotto[]> {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
}

export async function saveProdotto(prodotto: Prodotto) {
  const db = await getDB();
  await db.put('prodotti', { ...prodotto, synced: false });
}

export async function deleteProdotto(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearProdotti() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

// eliminazione offline
export async function markProdottoAsDeleted(id: number) {
  const db = await getDB();
  await db.put(DELETED_STORE_NAME, { id });
  await db.delete(STORE_NAME, id);
}

export async function getProdottiEliminati(): Promise<{ id: number }[]> {
  const db = await getDB();
  return await db.getAll(DELETED_STORE_NAME);
}

export async function clearProdottiEliminati() {
  const db = await getDB();
  await db.clear(DELETED_STORE_NAME);
}