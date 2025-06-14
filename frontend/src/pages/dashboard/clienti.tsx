import { useEffect, useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import SchedaClienteDialog from '../../components/schedaClienteDialog.tsx';

import AddClienteDialog from '../../components/addClienteDialog';
import type { Cliente } from '../../components/addClienteDialog';

import useClientiSync from '../../sync/useClientiSync';
import { saveCliente, deleteCliente as deleteLocalCliente, getAllClienti, markClienteAsDeleted } from '../../storage/clientiDB';

export default function Clienti() {
  //const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/clienti');
        if (!res.ok) throw new Error(`Server risponde con ${res.status}`);
        const datiOnline = await res.json();
        setClienti(datiOnline);
      } catch (e) {
        console.error('❌ Errore nel caricamento online, provo offline');
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
  if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/clienti/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await deleteLocalCliente(id);
        } else {
          const errTxt = await response.text();
          await Swal.fire({
            icon: 'error',
            title: 'Errore nella cancellazione online',
            text: errTxt || 'Si è verificato un problema sul server.'
          });
        }
      } catch (err:any) {
        await Swal.fire({
          icon: 'error',
          title: 'Errore di rete',
          text: err.message || 'Impossibile contattare il server.'
        });
      }
    } else {
      await markClienteAsDeleted(id);
      await Swal.fire({
      icon: 'warning',
      title: 'Eliminazione offline',
        text: `Il cliente è stato rimosso localmente e sincronizzato successivamente.`,
        timer: 1400,
        showConfirmButton: false,
      });
    }
    
    const locali = await getAllClienti();
    setClienti(locali);
  };

  const handleSave = async (cliente: Partial<Cliente>) => {
    const isModifica = !!editing;
    const { id, createdAt, synced, ...dataToSend } = cliente;

    if (navigator.onLine) {
      try {
        if (isModifica && id !== undefined) {
          const res = await fetch(`http://localhost:4000/api/clienti/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (res.ok) {
            const aggiornato = await res.json();
            await saveCliente({ ...aggiornato, synced: true });
          } else {
            const testoErr = await res.text();
            await Swal.fire({
              icon: 'error',
              title: 'Errore aggiornamento',
              text: testoErr || 'Impossibile aggiornare il cliente.'
            });
          }
        } else {
          const res = await fetch(`http://localhost:4000/api/clienti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          if (res.ok) {
            const nuovo = await res.json();
            await saveCliente({ ...nuovo, synced: true });
          } else {
            const testoErr = await res.text();
            await Swal.fire({
              icon: 'error',
              title: 'Errore salvataggio online',
              text: testoErr || 'Impossibile creare il cliente.'
            });
          }
        }
      } catch (err: any){
        await Swal.fire({
          icon: 'error',
          title: 'Errore di rete',
          text: err.message || 'Controlla la connessione e riprova.'
        });
      }
    } else {
      const offline = {
        ...dataToSend,
        id: isModifica && id !== undefined ? id : Date.now(),
        synced: false,
        createdAt: new Date().toISOString(),
      } as Cliente;

      await saveCliente(offline);
        await Swal.fire({
          icon: 'warning',
          title: isModifica
            ? 'Modifica salvata offline'
            : 'Cliente salvato offline',
          text: 'Le modifiche verranno sincronizzate quando torni online.',
          timer: 1400,
          showConfirmButton: false,
        });
    }

    const locali = await getAllClienti();
    setClienti(locali);
    setEditing(null);
    setOpen(false);
  };

  // filtri
  const clientiFiltrati = clienti.filter(c =>
    c.nomeCliente.toLowerCase().includes(query.toLowerCase()) ||
    c.cognomeCliente.toLowerCase().includes(query.toLowerCase()) ||
    c.ragioneSociale.toLowerCase().includes(query.toLowerCase()) ||
    c.partitaIva.includes(query)
  );

  // colonne tabella
  const columns: GridColDef[] = [
    { field: 'nomeCliente', headerName: 'Nome', width: 150 },
    { field: 'cognomeCliente', headerName: 'Cognome', width: 150 },
    { field: 'ragioneSociale', headerName: 'Ragione Sociale', width: 200 },
    // { field: 'partitaIva', headerName: 'P.IVA', width: 150 },
    { field: 'telefonoCell', headerName: 'Telefono', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 100,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => {
            Swal.fire({
              title: `Eliminare il cliente ${params.row.nomeCliente}?`,
              text: 'Operazione irreversibile',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, elimina',
              cancelButtonText: 'No',
              focusConfirm: false,   // non mettere subito a fuoco il Confirm
              focusCancel: true,     // metti a fuoco prima il Cancel
              allowEnterKey: true,   // abilita Enter per confermare
            }).then(res => {
              if (res.isConfirmed) {
                handleDelete(params.row.id);             // la tua funzione di delete
                Swal.fire('Eliminato!', '', 'success');
              }
            });
          }}>
            <DeleteIcon/>
          </IconButton>
        </>
      )
    },
    { 
      width: 100,
      field: 'view',
      headerName: 'Visualizza',
      renderCell: params => (
        <IconButton onClick={() => {
            setSelectedCliente(params.row);
            setViewOpen(true);
          }}>
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>Gestione Clienti</Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className='btn'
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
        sx={{ mb: 3, mt: 2 }}
        className='input-tondi'
      />

      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <DataGrid
          rows={clientiFiltrati}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } }
          }}
          pageSizeOptions={[25, 50, 100]}
          sx={{borderRadius: '32px', padding: '1em'}}
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

      <SchedaClienteDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        cliente={selectedCliente}
      />
    </Box>
  );
}