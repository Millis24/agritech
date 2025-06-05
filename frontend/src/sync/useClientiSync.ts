import { useEffect } from 'react';
import { getAllClienti, deleteCliente, saveCliente, getClientiEliminati, clearClientiEliminati } from '../storage/clientiDB';

export default function useClientiSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      // sincronizza clienti aggiunti o modificati offline
      const locali = await getAllClienti();
      const daSincronizzare = locali.filter(c => !c.synced);

      for (const cliente of daSincronizzare) {
        try {
          const { id, synced, ...data } = cliente;
          const res = await fetch('http://localhost:4000/api/clienti', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            await deleteCliente(id);
            console.log(`✅ Cliente '${cliente.nomeCliente}' sincronizzato`);
          }
        } catch (err) {
          console.error('❌ Sync cliente fallita:', err);
        }
      }

      // sincronizza eliminazioni offline
      const eliminati = await getClientiEliminati();
      for (const { id } of eliminati) {
        try {
          const res = await fetch(`http://localhost:4000/api/clienti/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            console.log(`🗑️ Cliente ID ${id} eliminato dal backend`);
          }
        } catch (err) {
          console.error('❌ Errore eliminazione remota:', err);
        }
      }
      await clearClientiEliminati();

      // recupera tutti i clienti aggiornati dal backend
      await fetchBackendClienti();
    };

    const fetchBackendClienti = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/clienti');
        if (!res.ok) return;
        const backendClienti = await res.json();
        for (const cliente of backendClienti) {
          await saveCliente({ ...cliente, synced: true });
        }
        console.log('✅ Clienti recuperati dal backend');
      } catch (err) {
        console.error('❌ Errore recupero clienti dal backend:', err);
      }
    };

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
}