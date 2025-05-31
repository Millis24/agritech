import { useEffect } from 'react';
import type { Imballaggio } from '../components/addImballaggioDialog.tsx';
import { getAllImballaggi, clearImballaggi } from '../storage/imballaggiDB';
import useOnlineStatus from '../hooks/useOnlineStatus';

async function inviaAlBackend(imballaggi: Imballaggio[]) {
  console.log('📡 Sync imballaggi verso il cloud: ', imballaggi);
  await new Promise((res) => setTimeout(res, 1000));
}

export default function useImballaggiSync() {
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) {
      getAllImballaggi().then(async (imballaggi) => {
        if (imballaggi.length > 0) {
          await inviaAlBackend(imballaggi);
          await clearImballaggi();
        }
      });
    }
  }, [online]);
}