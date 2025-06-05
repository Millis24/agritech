import { useEffect } from 'react';
import { getAllBolle, deleteBolla, saveBolla, getBolleEliminate, clearBolleEliminate } from '../storage/bolleDB';

export default function useBolleSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      // sincronizza bolle non ancora sincronizzate
      const locali = await getAllBolle();
      const daSincronizzare = locali.filter(b => !b.synced);

      for (const bolla of daSincronizzare) {
        try {
          const { id, synced, ...data } = bolla;

          const res = await fetch('http://localhost:4000/api/bolle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (res.ok) {
            await deleteBolla(id);
            console.log(`✅ Bolla ${bolla.numeroBolla} sincronizzata`);
          }
        } catch (err) {
          console.error('❌ Sync bolla fallita:', err);
        }
      }

      // sincronizza eliminazioni offline
      const eliminati = await getBolleEliminate();
      for (const { id } of eliminati) {
        try {
          const res = await fetch(`http://localhost:4000/api/bolle/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            console.log(`🗑️ Bolla ID ${id} eliminata dal backend`);
          }
        } catch (err) {
          console.error('❌ Errore eliminazione remota bolla:', err);
        }
      }
      await clearBolleEliminate();

      // recupera dal backend le bolle aggiornate
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