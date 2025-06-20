import { useEffect } from 'react';
import { getAllProdotti, deleteProdotto, saveProdotto, getProdottiEliminati, clearProdottiEliminati } from '../storage/prodottiDB';

export default function useProdottiSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      // sincronizza prodotti aggiunti o modificati offline
      const locali = await getAllProdotti();
      const daSincronizzare = locali.filter(p => p.synced === false);

      for (const prodotto of daSincronizzare) {
        try {
          const { id, synced, ...data } = prodotto;
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/prodotti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            await deleteProdotto(id);
            console.log(`✅ Prodotto '${prodotto.nome}' sincronizzato`);
          }
        } catch (err) {
          console.error('❌ Sync prodotto fallita:', err);
        }
      }

      // sincronizza eliminazioni offline
      const eliminati = await getProdottiEliminati();
      for (const { id } of eliminati) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/prodotti/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            console.log(`Prodotto ID ${id} eliminato dal backend`);
          }
        } catch (err) {
          console.error('❌ Errore eliminazione remota:', err);
        }
      }
      await clearProdottiEliminati();

      // recupera tutti i prodotti aggiornati dal backend
      await fetchBackendProdotti();
    };

    const fetchBackendProdotti = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/prodotti`);
        if (!res.ok) return;
        const backendProdotti = await res.json();
        for (const prodotto of backendProdotti) {
          await saveProdotto({ ...prodotto, synced: true });
        }
        console.log('✅ Prodotti recuperati dal backend');
      } catch (err) {
        console.error('❌ Errore recupero prodotti dal backend:', err);
      }
    };

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
}