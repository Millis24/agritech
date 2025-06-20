import { useEffect } from 'react';
import {
  getAllBolle,
  saveBolla,
} from '../storage/bolleDB';
import {
  getBolleEliminate,
  clearBolleEliminate
} from '../storage/bolleEliminateDB';

import { getDB } from '../storage/indexedDb';

const STORE_NAME = 'bolle';

// ✅ Elimina localmente una bolla da IndexedDB
export async function deleteLocalBolla(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function removeBollaEliminata(id: number) {
  const db = await getDB();
  await db.delete('bolleEliminate', id);
}

// ✅ Effettua la sincronizzazione automatica
export default function useBolleSync() {
  useEffect(() => {
    console.log('🛰️ useBolleSync attivo');

    const sync = async () => {
      if (!navigator.onLine) return;

      // 1. 🔄 Carica bolle locali da IndexedDB
      const locali = await getAllBolle();
      console.log('📦 Bolle in IndexedDB:', locali);

      // 2. 🔍 Carica ID delle bolle eliminate offline
      const eliminati = await getBolleEliminate();
      const eliminatiIds = eliminati.map(b => b.id).filter((id): id is number => typeof id === 'number');

      // 3. 🎯 Filtra bolle da sincronizzare (esclude quelle eliminate)
      const daSincronizzare = locali
        .filter(b => b.id !== undefined && !eliminatiIds.includes(b.id))
        .filter(b => !b.synced || b.modifiedOffline);

      // 4. 🗑️ Elimina dal backend le bolle eliminate offline
      for (const { id } of eliminati) {
        if (id !== undefined) {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bolle/${id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              console.log(`🗑️ Bolla ID ${id} eliminata dal backend`);
              await deleteLocalBolla(id); // rimuove anche da IndexedDB
              await removeBollaEliminata(id); // rimuovi SOLO quella da eliminate
            } else {
              console.error(`❌ Errore DELETE bolla ID ${id}:`, await res.text());
            }
          } catch (err) {
            console.error('❌ Errore eliminazione remota bolla:', err);
          }
        }
      }

      // 5. 🔄 Salva o aggiorna bolle
      for (const bolla of daSincronizzare) {
        try {
          const { id, synced, modifiedOffline, ...data } = bolla;
          let res;

          if (id !== undefined && modifiedOffline) {
            // ✏️ MODIFICA
            res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bolle/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            } else {
              // ➕ NUOVA
              const tempId = id!; // l’id assegnato offline
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bolle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });

              if (res.ok) {
                const nuovaBolla = await res.json();
                // 1) cancella il record offline con tempId
                await deleteLocalBolla(tempId);
                // 2) salva la bolla vera con id del server
                await saveBolla({
                  ...nuovaBolla,
                  synced: true,
                  modifiedOffline: false,
                });
                console.log('✅ Bolla creata e ID temporaneo sostituito');
              } else {
                console.error(`❌ Errore sync nuova bolla:`, await res.text());
              }
              // passiamo al prossimo elemento senza rieseguire il blocco generico
              continue;
            }

          if (res.ok) {
            const nuovaBolla = await res.json();
            await saveBolla({
              ...nuovaBolla,
              ///id: id ?? nuovaBolla.id, 
              synced: true,
              modifiedOffline: false,
            });
            console.log(modifiedOffline ? '✏️ Bolla aggiornata' : '✅ Bolla sincronizzata');
          } else {
            console.error(`❌ Errore sync bolla ${bolla.numeroBolla}:`, await res.text());
          }
        } catch (err) {
          console.error('❌ Sync fallita:', err);
        }
      }

      // 6. ✅ Pulisci store delle eliminate
      await clearBolleEliminate();

      // 7. 🔁 Recupera tutte le bolle aggiornate dal backend
      await fetchBackendBolle();
    };

    // 🔁 Carica tutte le bolle online e salva localmente
    const fetchBackendBolle = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bolle`);
        if (!res.ok) return;

        const backendBolle = await res.json();
        for (const bolla of backendBolle) {
          await saveBolla({ ...bolla, synced: true });
        }
        console.log('✅ Bolle recuperate dal backend');
      } catch (err) {
        console.error('❌ Errore nel recupero bolle dal backend', err);
      }
    };

    // 🚀 Avvia subito e riascolta il ritorno online
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
}