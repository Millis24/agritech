import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddClienteDialog from '../../components/addClienteDialog';
import type { Cliente } from '../../components/addClienteDialog';

import useClientiSync from '../../sync/useClientiSync';
import {
  saveCliente,
  deleteCliente as deleteLocalCliente,
  getAllClienti
} from '../../storage/clientiDB';

export default function Clienti() {
  const [query, setQuery] = useState('');
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/clienti');
        if (!res.ok) throw new Error('Errore fetch clienti online');
        const data = await res.json();
        setClienti(data);
      } catch (e) {
        console.error('Errore nel caricamento online. Uso cache locale.');
        const locali = await getAllClienti();
        setClienti(locali);
      }
    } else {
      const locali = await getAllClienti();
      setClienti(locali);
    }
  };

  useEffect(() => {
    ricaricaDati();
  }, []);

  useClientiSync();

  const handleEditClick = (row: Cliente) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/clienti/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await deleteLocalCliente(id);
        await ricaricaDati();
      } else {
        alert('❌ Errore nella cancellazione');
      }
    } catch (e) {
      alert('❌ Errore di rete');
    }
  };

  const handleSave = async (cliente: Partial<Cliente>) => {
    const isEdit = !!editing;

    const { id, createdAt, synced, ...dataToSend } = cliente;

    if (isEdit && id) {
      try {
        const res = await fetch(`http://localhost:4000/api/clienti/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });
        if (!res.ok) throw new Error();
        await ricaricaDati();
      } catch {
        alert('❌ Errore aggiornamento');
      }
    } else {
      if (navigator.onLine) {
        try {
          const res = await fetch('http://localhost:4000/api/clienti', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (!res.ok) throw new Error();
          await ricaricaDati();
        } catch {
          alert('❌ Errore salvataggio online');
        }
      } else {
        const offlineCliente: Cliente = {
          ...(dataToSend as Cliente),
          id: Date.now(),
          synced: false
        };
        await saveCliente(offlineCliente);
        alert('⚠️ Salvato offline');
        await ricaricaDati();
      }
    }

    setEditing(null);
    setOpen(false);
  };

  const clientiFiltrati = clienti.filter(c =>
    c.nomeCliente.toLowerCase().includes(query.toLowerCase()) ||
    c.ragioneSociale.toLowerCase().includes(query.toLowerCase()) ||
    c.partitaIva.includes(query)
  );

  const columns: GridColDef[] = [
    { field: 'nomeCliente', headerName: 'Nome', width: 150 },
    { field: 'ragioneSociale', headerName: 'Ragione Sociale', width: 200 },
    { field: 'partitaIva', headerName: 'P.IVA', width: 150 },
    { field: 'telefono', headerName: 'Telefono', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestione Clienti</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Aggiungi Cliente
        </Button>
      </Box>

      <TextField
        label="Cerca cliente"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={clientiFiltrati}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddClienteDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        cliente={editing}
      />
    </Box>
  );
}