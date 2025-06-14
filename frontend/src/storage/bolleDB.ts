import { getDB } from './indexedDb';

const STORE_NAME = 'bolle';
const DELETED_STORE_NAME = 'clientiEliminati';

export async function saveBolla(bolla: Bolla) {
  const db = await getDB();
  const { id, ...data } = bolla;
  if (id !== undefined) {
    // se c'è già un ID → update o insert con ID esistente
    return db.put('bolle', { id, ...data });
  }
  // genera nuovo ID incrementale locale
  const tutte = await db.getAll('bolle');
  const nuovoId = tutte.length > 0
    ? Math.max(...tutte.map(b => b.id || 0)) + 1
    : 1;

  return db.put('bolle', { id: nuovoId, ...data });
}

export async function getAllBolle(): Promise<Bolla[]> {
  const db = await getDB();
  const tutte = await db.getAll('bolle');
  const eliminate = await db.getAll('bolleEliminate');
  const eliminateIds = eliminate.map(e => e.id).filter((id): id is number => typeof id === 'number');

  return tutte.filter(b => b.id !== undefined && !eliminateIds.includes(b.id));
}

export async function deleteBolla(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

// Eliminazioni offline
export async function markBollaAsDeleted(id: number) {
  const db = await getDB();
  await db.put('bolleEliminate', { id }); // poi registra l’eliminazione
  await db.delete('bolle', id); // elimina SUBITO la bolla
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
  destinatarioCognome: string;
  id?: number;
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

