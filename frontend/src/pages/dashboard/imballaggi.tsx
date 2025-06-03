import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddImballaggioDialog from '../../components/addImballaggioDialog';
import type { Imballaggio } from '../../components/addImballaggioDialog';

import {
  saveImballaggio,
  deleteImballaggio as deleteLocalImballaggio,
  getAllImballaggi
} from '../../storage/imballaggiDB';
import useImballaggiSync from '../../sync/useImballaggiSync';

export default function Imballaggi() {
  const [data, setData] = useState<Imballaggio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);

  useEffect(() => {
    const caricaImballaggi = async () => {
      const locali = await getAllImballaggi();
      setData(locali);
    };
    caricaImballaggi();
  }, []);

  useImballaggiSync();

  const handleEdit = (row: Imballaggio) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      setData((prev) => prev.filter((i) => i.id !== id));
      // TODO: elimina anche da backend
    } else {
      await deleteLocalImballaggio(id);
      alert('⚠️ Sei offline. L’imballaggio verrà rimosso dal cloud alla riconnessione.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
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
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Gestione Imballaggi</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Aggiungi Imballaggio
        </Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
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
        onSave={async (newImb) => {
          const imballaggioConSync = {
            ...newImb,
            synced: navigator.onLine ? true : false,
            id: editing ? newImb.id : Date.now()
          };

          if (editing) {
            setData((prev) =>
              prev.map((i) => (i.id === newImb.id ? imballaggioConSync : i))
            );
          } else {
            setData((prev) => [...prev, imballaggioConSync]);
          }

          if (navigator.onLine) {
            try {
              await fetch('http://localhost:4000/api/imballaggi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(imballaggioConSync)
              });
              console.log('🟢 Online: imballaggio inviato al backend');
            } catch (err) {
              console.error('❌ Errore di rete, salvataggio locale');
              await saveImballaggio(imballaggioConSync);
            }
          } else {
            await saveImballaggio(imballaggioConSync);
            alert('⚠️ Sei offline. L’imballaggio è stato salvato localmente e verrà sincronizzato.');
          }

          setEditing(null);
        }}
        imballaggio={editing}
      />
    </Box>
  );
}