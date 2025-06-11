import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AddProdottoDialog from '../../components/addProdottoDialog';
import type { Prodotto } from '../../components/addProdottoDialog';

import useProdottiSync from '../../sync/useProdottiSync';
import { saveProdotto, deleteProdotto as deleteLocalProdotto, getAllProdotti, markProdottoAsDeleted } from '../../storage/prodottiDB';
import Swal from 'sweetalert2';

export default function Prodotti() {
  const [query, setQuery] = useState('');
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Prodotto | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:4000/api/prodotti');
        if (!res.ok) throw new Error('❌ Errore fetch prodotti online');
        const datiOnline = await res.json();
        setProdotti(datiOnline);
      } catch (e) {
        console.error('❌ Errore nel caricamento online, provo offline');
        const locali = await getAllProdotti();
        setProdotti(locali);
      }
    } else {
      const locali = await getAllProdotti();
      setProdotti(locali);
    }
  };

  useEffect(() => {
    ricaricaDati();
  }, []);

  useProdottiSync();

  const handleEditClick = (row: Prodotto) => {
    setEditing(row);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
  if (navigator.onLine) {
    try {
      const response = await fetch(`http://localhost:4000/api/prodotti/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await deleteLocalProdotto(id);
      } else {
        alert('❌ Errore nella cancellazione online');
      }
    } catch (error) {
      alert('❌ Errore di rete');
    }
  } else {
    await markProdottoAsDeleted(id);
    alert('⚠️ Eliminato offline, sarà sincronizzato');
  }

  const locali = await getAllProdotti();
  setProdotti(locali);
  };

  const handleSave = async (prodotto: Partial<Prodotto>) => {
    const isModifica = !!editing;
    const { id, createdAt, synced, ...dataToSend } = prodotto;

    if (navigator.onLine) {
      try {
        if (isModifica && id !== undefined) {
          const res = await fetch(`http://localhost:4000/api/prodotti/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          console.log('🔁 PUT /prodotti Status:', res.status);
          const body = await res.text();
          console.log('📥 PUT /prodotti Body:', body);

          if (res.ok) {
            const aggiornato = JSON.parse(body);
            await saveProdotto({ ...aggiornato, synced: true });
          } else {
            alert('❌ Errore aggiornamento');
          }
        } else {
          const res = await fetch(`http://localhost:4000/api/prodotti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          console.log('🆕 POST /prodotti Status:', res.status);
          const body = await res.text();
          console.log('📥 POST /prodotti Body:', body);

          if (res.ok) {
            const nuovo = JSON.parse(body);
            await saveProdotto({ ...nuovo, synced: true });
          } else {
            alert('❌ Errore salvataggio online');
          }
        }
      } catch (error) {
        console.error('❌ Errore rete:', error);
        alert('❌ Errore rete');
      }
    } else {
      const offline = {
        ...dataToSend,
        id: isModifica && id !== undefined ? id : Date.now(),
        synced: false,
        createdAt: new Date().toISOString(),
      } as Prodotto;

      await saveProdotto(offline);
      alert(isModifica ? '⚠️ Modifica salvata offline' : '⚠️ Salvato offline');
    }

    const locali = await getAllProdotti();
    setProdotti(locali);
    setEditing(null);
    setOpen(false);
  };

  // filtri
  const prodottiFiltrati = prodotti.filter(p =>
    p.nome.toLowerCase().includes(query.toLowerCase()) ||
    p.varieta.toLowerCase().includes(query.toLowerCase()) ||
    p.calibro.toLowerCase().includes(query.toLowerCase()) ||
    p.colore.toLowerCase().includes(query.toLowerCase())
  );

  // colonne tabella
  const columns: GridColDef[] = [
    { field: 'nome', headerName: 'Nome', width: 150 },
    { field: 'varieta', headerName: 'Varietà', width: 150 },
    { field: 'calibro', headerName: 'Calibro', width: 150 },
    { field: 'colore', headerName: 'Colore', width: 150 },
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
              title: `Eliminare il prodotto ${params.row.nome}?`,
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestione Prodotti</Typography>
        <Button variant="contained" onClick={() => {
          setEditing(null);
          setOpen(true);
        }}>
          Aggiungi Prodotto
        </Button>
      </Box>

      <TextField
        label="Cerca prodotto"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={prodottiFiltrati}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } }
          }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddProdottoDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        prodotto={editing}
      />
    </Box>
  );
}