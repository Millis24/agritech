import { openDB } from 'idb';

const DB_NAME = 'EliminazioniDB';
const STORE_NAME = 'eliminazioni';

async function getDB() {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
  return db;
}

// Aggiunge un ID alla lista delle eliminazioni offline per un modulo (es: 'prodotti')
export async function saveEliminazione(tipo: string, id: number) {
  const db = await getDB();
  const eliminati = (await db.get(STORE_NAME, tipo)) || [];
  if (!eliminati.includes(id)) {
    eliminati.push(id);
    await db.put(STORE_NAME, eliminati, tipo);
  }
}

// Ottiene la lista di ID da eliminare per un modulo
export async function getEliminazioni(tipo: string): Promise<number[]> {
  const db = await getDB();
  return (await db.get(STORE_NAME, tipo)) || [];
}

// Rimuove un ID dopo che è stato eliminato correttamente dal backend
export async function removeEliminazione(tipo: string, id: number) {
  const db = await getDB();
  const eliminati = (await db.get(STORE_NAME, tipo)) || [];
  const filtrati = eliminati.filter((eliminatoId: number) => eliminatoId !== id);
  await db.put(STORE_NAME, filtrati, tipo);
}

// Pulisce completamente la lista delle eliminazioni per un modulo
export async function clearEliminazioni(tipo: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, tipo);
}