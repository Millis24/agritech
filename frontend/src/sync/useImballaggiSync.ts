import { useEffect } from 'react';
import {
  getAllImballaggi,
  deleteImballaggio,
  saveImballaggio
} from '../storage/imballaggiDB';

export default function useImballaggiSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      const locali = await getAllImballaggi();
      const daSincronizzare = locali.filter(i => !i.synced);

      for (const i of daSincronizzare) {
        try {
          const { id, synced, ...data } = i;
          const res = await fetch('http://localhost:4000/api/imballaggi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (res.ok) {
            await deleteImballaggio(id);
            console.log(`✅ Imballaggio ${i.tipo} sincronizzato`);
          }
        } catch (err) {
          console.error('❌ Sync fallita', err);
        }
      }
    };

    const fetchFromBackend = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/imballaggi');
        if (!res.ok) return;
        const backendData = await res.json();
        for (const i of backendData) {
          await saveImballaggio({ ...i, synced: true });
        }
        console.log('✅ Imballaggi recuperati dal backend');
      } catch (err) {
        console.error('❌ Errore nel recupero imballaggi dal backend', err);
      }
    };

    window.addEventListener('online', sync);
    sync();
    fetchFromBackend();

    return () => window.removeEventListener('online', sync);
  }, []);
}