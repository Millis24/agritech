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

      for (const imballaggio of daSincronizzare) {
        try {
          const { id, synced, ...data } = imballaggio;
          const res = await fetch('http://localhost:4000/api/imballaggi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (res.ok) {
            await deleteImballaggio(id);
            console.log(`✅ Imballaggio ${imballaggio.tipo} sincronizzato`);
          }
        } catch (err) {
          console.error('❌ Sync fallita', err);
        }
      }
    };

    const fetchBackendImballaggi = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/imballaggi');
        if (!res.ok) return;
        const backendImballaggi = await res.json();

        for (const i of backendImballaggi) {
          await saveImballaggio({ ...i, synced: true });
        }

        console.log('✅ Imballaggi recuperati dal backend');
      } catch (err) {
        console.error('❌ Errore nel recupero imballaggi dal backend', err);
      }
    };

    window.addEventListener('online', sync);
    fetchBackendImballaggi();
    sync();

    return () => window.removeEventListener('online', sync);
  }, []);
}