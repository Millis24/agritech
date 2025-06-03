import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddImballaggioDialog from '../../components/addImballaggioDialog';
import type { Imballaggio } from '../../components/addImballaggioDialog';

import useImballaggiSync from '../../sync/useImballaggiSync';
import {
  saveImballaggio,
  deleteImballaggio as deleteLocalImballaggio,
  getAllImballaggi
} from '../../storage/imballaggiDB';

export default function Imballaggi() {
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);
  const [query, setQuery] = useState('');

  const imballaggiFiltrati = imballaggi.filter(i =>
    i.tipo.toLowerCase().includes(query.toLowerCase()) ||
    i.dimensioni.toLowerCase().includes(query.toLowerCase()) ||
    String(i.capacitaKg).includes(query)
  );

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/imballaggi');
        if (!res.ok) throw new Error('Fetch fallita');
        const datiOnline = await res.json();
        setImballaggi(datiOnline);
      } catch (e) {
        console.error('❌ Errore nel caricamento online, provo offline');
        const offline = await getAllImballaggi();
        setImballaggi(offline);
      }
    } else {
      const offline = await getAllImballaggi();
      setImballaggi(offline);
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
    try {
      const response = await fetch(`http://localhost:4000/api/imballaggi/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await deleteLocalImballaggio(id);
        await ricaricaDati();
      } else {
        console.error('Errore nella cancellazione dell\'imballaggio');
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleSave = async (nuovo: Imballaggio) => {
    const { id, createdAt, synced, ...dataToSend } = nuovo;
    dataToSend.capacitaKg = Number(dataToSend.capacitaKg);

    if (editing) {
      try {
        const res = await fetch(`http://localhost:4000/api/imballaggi/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
        if (res.ok) {
          await ricaricaDati();
        } else {
          alert('❌ Errore nell\'aggiornamento');
        }
      } catch (e) {
        alert('❌ Errore di rete');
      }
    } else {
      if (navigator.onLine) {
        try {
          const res = await fetch(`http://localhost:4000/api/imballaggi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (res.ok) {
            await ricaricaDati();
          } else {
            alert('❌ Errore nel salvataggio online');
          }
        } catch (e) {
          alert('❌ Errore di rete');
        }
      } else {
        const offlineImb = { ...nuovo, id: Date.now(), synced: false };
        await saveImballaggio(offlineImb);
        alert('⚠️ Salvato offline');
        await ricaricaDati();
      }
    }

    setEditing(null);
    setOpen(false);
  };

  const columns: GridColDef[] = [
    //{ field: 'id', headerName: 'ID', width: 90 },
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