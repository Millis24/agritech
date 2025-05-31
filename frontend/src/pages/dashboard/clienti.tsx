import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import AddClienteDialog from '../../components/addClienteDialog.tsx';
import type { Cliente } from '../../components/addClienteDialog.tsx';
import useClientiSync from '../../sync/useClientiSync.ts';
import { saveCliente, deleteCliente as deleteLocalCliente } from '../../storage/clientiDB.ts';


export default function Clienti() {
  const [clienti, setClienti] = useState<Cliente[]>([
    {
      id: 1,
      nomeCliente: 'Fruttagri',
      ragioneSociale: 'Fruttagri SRL',
      partitaIva: 'IT01234567890',
      telefono: '3401234567',
      email: 'info@fruttagri.it',
    },
    {
      id: 2,
      nomeCliente: 'Orto Sud',
      ragioneSociale: 'Orto Sud SRL',
      partitaIva: 'IT09876543210',
      telefono: '3897654321',
      email: 'contatti@ortosud.it',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      setClienti((prev) => prev.filter((c) => c.id !== id));
      // TODO: elimina da backend in futuro
    } else {
      await deleteLocalCliente(id);
      alert('⚠️ Sei offline. Il cliente verrà eliminato dal cloud alla riconnessione.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
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

  useClientiSync(); // sincronizza i clienti locali quando torna online

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
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
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
            // TODO: invio a backend (quando lo avrai)
            console.log('🟢 Online: cliente salvato normalmente');
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