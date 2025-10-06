import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { getBaseUrl } from '../../lib/getBaseUrl';
import AddCorriereDialog, { type Corriere } from '../../components/addCorriereDialog';

export default function Logistica() {
  const [corrieri, setCorrieri] = useState<Corriere[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Corriere | null>(null);

  const ricaricaDati = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/corrieri`);
      if (!res.ok) throw new Error(`Server risponde con ${res.status}`);
      const dati = await res.json();
      setCorrieri(dati);
    } catch (e) {
      console.error('❌ Errore nel caricamento corrieri:', e);
      Swal.fire({
        icon: 'error',
        title: 'Errore',
        text: 'Impossibile caricare i corrieri'
      });
    }
  };

  useEffect(() => {
    ricaricaDati();
  }, []);

  const handleEditClick = (row: Corriere) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${getBaseUrl()}/corrieri/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await ricaricaDati();
      } else {
        const errTxt = await response.text();
        await Swal.fire({
          icon: 'error',
          title: 'Errore nella cancellazione',
          text: errTxt || 'Si è verificato un problema sul server.'
        });
      }
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Errore di rete',
        text: err.message || 'Impossibile contattare il server.'
      });
    }
  };

  const handleSave = async (corriere: Partial<Corriere>) => {
    try {
      if (editing) {
        const res = await fetch(`${getBaseUrl()}/corrieri/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corriere)
        });

        if (res.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Salvato!',
            text: 'Corriere aggiornato con successo',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          const testoErr = await res.text();
          await Swal.fire({
            icon: 'error',
            title: 'Errore aggiornamento',
            text: testoErr || 'Impossibile aggiornare il corriere.'
          });
        }
      } else {
        const res = await fetch(`${getBaseUrl()}/corrieri`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corriere)
        });

        if (res.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Salvato!',
            text: 'Corriere creato con successo',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          const testoErr = await res.text();
          await Swal.fire({
            icon: 'error',
            title: 'Errore salvataggio',
            text: testoErr || 'Impossibile creare il corriere.'
          });
        }
      }

      await ricaricaDati();
      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Errore di rete',
        text: err.message || 'Controlla la connessione e riprova.'
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'nome', headerName: 'Nome Corriere', width: 200 },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => {
            Swal.fire({
              title: `Eliminare ${params.row.nome}?`,
              text: 'Operazione irreversibile',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, elimina',
              cancelButtonText: 'No',
              focusConfirm: false,
              focusCancel: true,
              allowEnterKey: true,
            }).then(res => {
              if (res.isConfirmed) {
                handleDelete(params.row.id);
                Swal.fire('Eliminato!', '', 'success');
              }
            });
          }}>
            <DeleteIcon />
          </IconButton>
        </>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Gestione Logistica - Corrieri</Typography>
        <Button className='btn' variant="contained" onClick={() => { setEditing(null); setOpen(true); }}>
          Aggiungi Corriere
        </Button>
      </Box>

      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <DataGrid
          rows={corrieri}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{
            sorting: {
              sortModel: [{ field: 'nome', sort: 'asc' }],
            },
            pagination: { paginationModel: { pageSize: 10, page: 0 } }
          }}
          pageSizeOptions={[10, 25, 100]}
          localeText={{
            footerRowSelected: (count) => `${count} riga/e selezionata/e`,
          }}
          slotProps={{
            pagination: {
              labelRowsPerPage: 'Righe per tabella:',
              labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} di ${count !== -1 ? count : `più di ${to}`}`
            }
          }}
          sx={{
            borderRadius: '32px',
            padding: '1em',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
          }}
        />
      </div>

      <AddCorriereDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={handleSave}
        corriere={editing}
      />
    </Box>
  );
}
