import { useEffect } from 'react';
import { getAllImballaggi, deleteImballaggio, saveImballaggio, getImballaggiEliminati } from '../storage/imballaggiDB';

import { getBaseUrl } from '../lib/getBaseUrl';

export default function useImballaggiSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      // sincronizza clienti aggiunti o modificati offline
      const locali = await getAllImballaggi();
      const daSincronizzare = locali.filter(i => i.synced === false);

      for (const imballaggio of daSincronizzare) {
        try {
          const { id, synced, ...data } = imballaggio;
          const res = await fetch(`${getBaseUrl()}/api/imballaggi`, {
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

       // sincronizza eliminazioni offline
      const eliminati = await getImballaggiEliminati();
      for (const { id } of eliminati) {
        try {
          const res = await fetch(`${getBaseUrl()}/api/imballaggi/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            console.log(`🗑️ Imballaggio ID ${id} eliminato dal backend`);
          }
        } catch (err) {
          console.error('❌ Errore eliminazione remota:', err);
        }
      }
      await getImballaggiEliminati();

      // recupera tutti gli imballaggi aggiornati dal backend
      await fetchFromBackendImballaggi(); 
    };

    const fetchFromBackendImballaggi = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/imballaggi`);
        if (!res.ok) return;
        const backendImballaggi = await res.json();
        for (const imballaggio of backendImballaggi) {
          await saveImballaggio({ ...imballaggio, synced: true });
        }
        console.log('✅ Imballaggi recuperati dal backend');
      } catch (err) {
        console.error('❌ Errore nel recupero imballaggi dal backend', err);
      }
    };

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
}