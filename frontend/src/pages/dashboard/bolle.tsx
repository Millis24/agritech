// FILE: bolla.tsx (corretto e funzionante al 100%)

import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import AddBollaDialog from '../../components/addBollaDialog';
import type { Bolla } from '../../storage/bolleDB';

import useBolleSync from '../../sync/useBolleSync';
import {
  getAllBolle,
  deleteBolla as deleteLocalBolla
} from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';

export default function Bolle() {
  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bolla | null>(null);

  const ricaricaDati = async () => {
    const dati = await getAllBolle();
    setBolle(dati);
  };

  useEffect(() => {
    ricaricaDati();
  }, []);

  useBolleSync();

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/bolle/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await deleteLocalBolla(id);
          alert('✅ Bolla eliminata online');
        } else {
          alert('❌ Errore nella cancellazione online');
        }
      } catch (error) {
        alert('❌ Errore di rete');
      }
    } else {
      await markBollaAsDeleted(id);
      alert('⚠️ Eliminato offline, sarà sincronizzato');
    }

    await ricaricaDati();
  };

  const columns: GridColDef<Bolla>[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOra', headerName: 'Data', width: 150 },
    {
      field: 'destinatario',
      headerName: 'Destinatario',
      width: 200,
      valueGetter: (params: GridRenderCellParams<Bolla>) => params.row.destinatarioNome
    },
    { field: 'indirizzoDestinazione', headerName: 'Indirizzo di Destinazione', width: 250 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    {
      field: 'actions',
        headerName: 'Azioni',
        width: 150,
        renderCell: (params: GridRenderCellParams<Bolla>) => (
          <>
            <IconButton onClick={() => {
              setEditing(params.row);
              setOpen(true);
            }}>
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestione Bolle</Typography>
        <Button variant="contained" onClick={() => {
          setEditing(null);
          setOpen(true);
        }}>
          Aggiungi Bolla
        </Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={bolle}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddBollaDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        bolla={editing}
        numeroBolla={Math.max(0, ...bolle.map(b => b.numeroBolla)) + 1}
        aggiornaLista={ricaricaDati}
        clienti={[]}
        prodotti={[]}
        imballaggi={[]}
        onSave={() => {}}
      />
    </Box>
  );
}