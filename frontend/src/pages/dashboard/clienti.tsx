import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddClienteDialog from '../../components/addClienteDialog';
import type { Cliente } from '../../components/addClienteDialog';

import { saveCliente, deleteCliente as deleteLocalCliente, getAllClienti } from '../../storage/clientiDB';
import useClientiSync from '../../sync/useClientiSync';

export default function Clienti() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    const caricaClienti = async () => {
      const locali = await getAllClienti();
      setClienti(locali);
    };
    caricaClienti();
  }, []);

  useClientiSync();

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      setClienti((prev) => prev.filter((c) => c.id !== id));
      // TODO: elimina anche da backend
    } else {
      await deleteLocalCliente(id);
      alert('⚠️ Sei offline. Il cliente verrà eliminato dal cloud alla riconnessione.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'nomeCliente', headerName: 'Nome', width: 150 },
    { field: 'ragioneSociale', headerName: 'Ragione Sociale', width: 200 },
    { field: 'partitaIva', headerName: 'Partita IVA', width: 150 },
    { field: 'telefono', headerName: 'Telefono', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
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
        <Typography variant="h5">Anagrafica Clienti</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditingCliente(null);
            setOpenDialog(true);
          }}
        >
          Aggiungi cliente
        </Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={clienti}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddClienteDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditingCliente(null);
        }}
        onSave={async (newCliente) => {
          if (editingCliente) {
            setClienti((prev) =>
              prev.map((c) => (c.id === newCliente.id ? newCliente : c))
            );
          } else {
            setClienti((prev) => [...prev, newCliente]);
          }

          if (navigator.onLine) {
            // TODO: salva su backend
            console.log('🟢 Cliente salvato online (simulato)');
          } else {
            await saveCliente(newCliente);
            alert('⚠️ Sei offline. Il cliente è stato salvato localmente e verrà sincronizzato.');
          }

          setEditingCliente(null);
        }}
        cliente={editingCliente}
      />
    </Box>
  );
}