import { useEffect } from 'react';
import { getAllClienti, deleteCliente } from '../storage/clientiDB';
import { saveCliente } from '../storage/clientiDB';

export default function useClientiSync() {
  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

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
            console.log(`✅ Cliente ${cliente.nomeCliente} sincronizzato`);
          }
        } catch (err) {
          console.error('❌ Sync fallita', err);
        }
      }
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
        console.error('❌ Errore nel recupero clienti dal backend', err);
      }
    };

    window.addEventListener('online', sync);
    fetchBackendClienti();
    sync();

    return () => window.removeEventListener('online', sync);
  }, []);
}