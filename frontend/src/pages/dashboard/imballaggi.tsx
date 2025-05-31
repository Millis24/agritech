import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import AddImballaggioDialog from '../../components/addImballaggioDialog.tsx';
import type { Imballaggio } from '../../components/addImballaggioDialog.tsx';
import useImballaggiSync from '../../sync/useImballaggiSync.ts';
import useOnlineStatus from '../../hooks/useOnlineStatus.ts';
import {
  saveImballaggio,
  deleteImballaggio as deleteLocalImballaggio
} from '../../storage/imballaggiDB.ts';

export default function Imballaggi() {
  const [data, setData] = useState<Imballaggio[]>([
    { id: 1, tipo: 'Cassa', dimensioni: '40x60', capacitàKg: 10, note: 'Plastica rigida' },
    { id: 2, tipo: 'Cartone', dimensioni: '50x70', capacitàKg: 12, note: 'Per uso export' }
  ]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);
  const online = useOnlineStatus();

  useImballaggiSync();

  const handleEdit = (row: Imballaggio) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (online) {
      setData((prev) => prev.filter((i) => i.id !== id));
      // TODO: eliminazione da backend
    } else {
      await deleteLocalImballaggio(id);
      alert('⚠️ Sei offline. L’imballaggio verrà rimosso dal cloud alla riconnessione.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'tipo', headerName: 'Tipo', width: 150 },
    { field: 'dimensioni', headerName: 'Dimensioni', width: 150 },
    { field: 'capacitàKg', headerName: 'Capacità (Kg)', width: 130 },
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
      )
    }
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
              paginationModel: { pageSize: 5, page: 0 }
            }
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
          if (editing) {
            setData((prev) =>
              prev.map((i) => (i.id === newImb.id ? newImb : i))
            );
          } else {
            setData((prev) => [...prev, newImb]);
          }

          if (online) {
            console.log('🟢 Online: imballaggio salvato');
            // TODO: invio a backend quando disponibile
          } else {
            await saveImballaggio(newImb);
            alert('⚠️ Sei offline. L’imballaggio è stato salvato localmente e sarà sincronizzato.');
          }

          setEditing(null);
        }}
        imballaggio={editing}
      />
    </Box>
  );
}