import { getDB } from './indexedDb';

const STORE_NAME = 'bolle';
const DELETED_STORE_NAME = 'clientiEliminati';

export async function saveBolla(bolla: Bolla) {
    const db = await getDB();
    return db.put(STORE_NAME, bolla);
}

export async function getAllBolle(): Promise<Bolla[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
}

export async function deleteBolla(id: number) {
    const db = await getDB();
    return db.delete(STORE_NAME, id);
}

// Eliminazioni offline
export async function markClienteAsDeleted(id: number) {
  const db = await getDB();
  await db.put(DELETED_STORE_NAME, { id });
  await db.delete(STORE_NAME, id);
}

export async function getBolleEliminate(): Promise<{ id: number }[]> {
  const db = await getDB();
  return await db.getAll(DELETED_STORE_NAME);
}

export async function clearBolleEliminate() {
  const db = await getDB();
    await db.clear(DELETED_STORE_NAME);
}

export interface Bolla {
  id: number;
  numeroBolla: number;
  dataOra: string;


  destinatarioNome: string;
  destinatarioIndirizzo: string;
  destinatarioEmail: string;
  destinatarioTelefono: string;
  destinatarioPartitaIva: string;
  destinatarioCodiceSDI: string;    

  // Indirizzo di destinazione (può differire)
  indirizzoDestinazione: string;
  // Causale di trasporto
  causale: string;

  prodotti: string;
  daTrasportare: string;
  daRendere: string;
  consegnaACarico: string;
  vettore: string;

  synced?: boolean;
  createdAt?: string;
  modifiedOffline?: boolean;
}

