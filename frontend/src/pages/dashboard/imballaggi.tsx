import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddImballaggioDialog from '../../components/addImballaggioDialog';

import useImballaggiSync from '../../sync/useImballaggiSync';
import { saveImballaggio, deleteImballaggio as deleteLocalImballaggio, getAllImballaggi, markImballaggiAsDeleted } from '../../storage/imballaggiDB';
import Swal from 'sweetalert2';

interface Imballaggio {
  id: number;
  tipo: string;
  prezzo: number;
  dimensioni: string;
  capacitaKg: number;
  note?: string;
  synced?: boolean;
  createdAt?: string;
}

export default function Imballaggi() {
  const [query, setQuery] = useState('');
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/imballaggi');
        if (!res.ok) throw new Error(`Server risponde con ${res.status}`);
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
        await markImballaggiAsDeleted(id);
        await Swal.fire({
        icon: 'warning',
        title: 'Eliminazione offline',
          text: `Il cliente è stato rimosso localmente e sincronizzato successivamente.`,
          timer: 1400,
          showConfirmButton: false
        });
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
            body: JSON.stringify({ ...dataToSend, prezzo: parseFloat(String(dataToSend.prezzo)) })
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
            body: JSON.stringify({ ...dataToSend, prezzo: parseFloat(String(dataToSend.prezzo)) })
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
        tipo: dataToSend.tipo ?? '',
        prezzo: dataToSend.prezzo ?? 0,
        dimensioni: dataToSend.dimensioni ?? '',
        capacitaKg: dataToSend.capacitaKg ?? 0,
        note: dataToSend.note ?? '',
        id: isModifica && id !== undefined ? id : Date.now(),
        synced: false,
        createdAt: new Date().toISOString()
      };

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
    { field: 'prezzo', headerName: 'Prezzo', width: 150 },
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
          <IconButton onClick={() => {
              Swal.fire({
                title: `Eliminare l'imballaggio ${params.row.tipo}?`,
                text: 'Operazione irreversibile',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sì, elimina',
                cancelButtonText: 'No',
              }).then(res => {
                if (res.isConfirmed) {
                  handleDelete(params.row.id);
                  Swal.fire('Eliminato!', '', 'success');
                }
              });
            }}>
              <DeleteIcon/>
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