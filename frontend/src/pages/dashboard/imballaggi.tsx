import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddImballaggioDialog from '../../components/addImballaggioDialog';
import type { Imballaggio } from '../../components/addImballaggioDialog';

import useImballaggiSync from '../../sync/useImballaggiSync';
import { saveImballaggio, deleteImballaggio as deleteLocalImballaggio, getAllImballaggi, markImballaggiAsDeleted } from '../../storage/imballaggiDB';

export default function Imballaggi() {
  const [query, setQuery] = useState('');
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/imballaggi');
        if (!res.ok) throw new Error('❌ Errore fetch imballaggi online');
        const datiOnline = await res.json();
        setImballaggi(datiOnline);
      } catch (e) {
        console.error('❌ Errore nel caricamento online, provo offline');
        const locali = await getAllImballaggi();
        setImballaggi(locali);
      }
    } else {
      const locali = await getAllImballaggi();
      setImballaggi(locali);
    }
  };

  useEffect(() => {
    ricaricaDati();
  }, []);

  useImballaggiSync();

  const handleEditClick = (row: Imballaggio) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/imballaggi/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await deleteLocalImballaggio(id);
          alert('✅ Prodotto eliminato online');
        } else {
          alert('❌ Errore nella cancellazione');
        }
      } catch (error) {
        alert('❌ Errore di rete');
      }
    } else {
        await markImballaggiAsDeleted(id);
        alert('⚠️ Eliminato offline, sarà sincronizzato');
    }

    const locali = await getAllImballaggi();
    setImballaggi(locali);
  };

  const handleSave = async (imballaggio: Partial<Imballaggio>) => {
    const isModifica = !!editing;
    const { id, createdAt, synced, ...dataToSend } = imballaggio;

    if (navigator.onLine) {
      try {
        if (isModifica && id !== undefined) {
          const res = await fetch(`http://localhost:4000/api/imballaggi/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (res.ok) {
            const aggiornato = await res.json();
            await saveImballaggio({ ...aggiornato, synced: true });
          } else {
            alert('❌ Errore aggiornamento');
          }
        } else {
          const res = await fetch(`http://localhost:4000/api/imballaggi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (res.ok) {
            const nuovo = await res.json();
            await saveImballaggio({ ...nuovo, synced: true });
          } else {
            alert('❌ Errore salvataggio online');
          }
        }
      } catch {
        alert('❌ Errore rete');
      }
    } else {
      const offline = {
        ...dataToSend,
        id: isModifica && id !== undefined ? id : Date.now(),
        synced: false
      } as Imballaggio;

      await saveImballaggio(offline);
      alert(isModifica ? '⚠️ Modifica salvata offline' : '⚠️ Salvato offline');
    }

    const locali = await getAllImballaggi();
    setImballaggi(locali);
    setEditing(null);
    setOpen(false);
  };

  // filtri
  const imballaggiFiltrati = imballaggi.filter(i =>
    i.tipo.toLowerCase().includes(query.toLowerCase()) ||
    i.dimensioni.toLowerCase().includes(query.toLowerCase()) ||
    String(i.capacitaKg).includes(query)
  );

  // colonne tabella
  const columns: GridColDef[] = [
    { field: 'tipo', headerName: 'Tipo', width: 150 },
    { field: 'dimensioni', headerName: 'Dimensioni', width: 150 },
    { field: 'capacitaKg', headerName: 'Capacità (Kg)', width: 130 },
    { field: 'note', headerName: 'Note', flex: 1 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Gestione Imballaggi</Typography>
        <Button variant="contained" onClick={() => {
          setEditing(null);
          setOpen(true);
        }}>
          Aggiungi Imballaggio
        </Button>
      </Box>

      <TextField
        label="Cerca imballaggio"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={imballaggiFiltrati}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } }
          }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddImballaggioDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        imballaggio={editing}
      />
    </Box>
  );
}