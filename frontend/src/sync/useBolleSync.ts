import { useEffect } from 'react';
import {
  getAllBolle,
  saveBolla,
  getBolleEliminate,
  clearBolleEliminate
} from '../storage/bolleDB';

export default function useBolleSync() {
  useEffect(() => {
    console.log('🛰️ useBolleSync attivo');
    const sync = async () => {
      if (!navigator.onLine) return;

      const locali = await getAllBolle();
      console.log('📦 Bolle in IndexedDB:', locali);
      const daSincronizzare = locali.filter(b => !b.synced || b.modifiedOffline);

      for (const bolla of daSincronizzare) {
        try {
          const { id, synced, modifiedOffline, ...data } = bolla;
          let res;
          if (modifiedOffline && (id === undefined || id === null)) {
            // MODIFICA esistente
            res = await fetch(`http://localhost:4000/api/bolle/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data }),
            });
          } else {
            // NUOVA bolla
            res = await fetch('http://localhost:4000/api/bolle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data }),
            });
          }

          if (res.ok) {
            const nuovaBolla = await res.json();
            await saveBolla({
              ...nuovaBolla,
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

      // Eliminazioni offline
      const eliminati = await getBolleEliminate();
      for (const { id } of eliminati) {
        try {
          const res = await fetch(`http://localhost:4000/api/bolle/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            console.log(`🗑️ Bolla ID ${id} eliminata dal backend`);
          } else {
            console.error(`❌ Errore DELETE bolla ID ${id}:`, await res.text());
          }
        } catch (err) {
          console.error('❌ Errore eliminazione remota bolla:', err);
        }
      }

      await clearBolleEliminate();
      await fetchBackendBolle();
    };

    const fetchBackendBolle = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/bolle');
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

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
}