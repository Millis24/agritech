import { useEffect } from 'react';
import type { Cliente } from '../components/addClienteDialog.tsx';
import { getAllClienti, clearClienti } from '../storage/clientiDB';
import useOnlineStatus from '../hooks/useOnlineStatus';

// Simula l'invio al backend
async function inviaAlBackend(clienti: Cliente[]) {
  console.log('📡 Sync verso il cloud: ', clienti);
  // Simula una chiamata API...
  await new Promise((res) => setTimeout(res, 1000));
}

export default function useClientiSync() {
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) {
      getAllClienti().then(async (clienti) => {
        if (clienti.length > 0) {
          await inviaAlBackend(clienti);
          await clearClienti();
        }
      });
    }
  }, [online]);
}