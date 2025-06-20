import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField, Stack } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { API_BASE } from '../../api/user';

import AddProdottoDialog from '../../components/addProdottoDialog';
import type { Prodotto } from '../../components/addProdottoDialog';

import useProdottiSync from '../../sync/useProdottiSync';
import { saveProdotto, deleteProdotto as deleteLocalProdotto, getAllProdotti, markProdottoAsDeleted } from '../../storage/prodottiDB';
import Swal from 'sweetalert2';

export default function Prodotti() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  });

  const [query, setQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Prodotto | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch(`${API_BASE}/api/prodotti`);
        if (!res.ok) throw new Error(`Server risponde con ${res.status}`);
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
      const response = await fetch(`${API_BASE}/api/prodotti/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await deleteLocalProdotto(id);
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
    await markProdottoAsDeleted(id);
    await Swal.fire({
    icon: 'warning',
    title: 'Eliminazione offline',
      text: `Il prodotto è stato rimosso localmente e sincronizzato successivamente.`,
      timer: 1400,
      showConfirmButton: false,
    });
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
          const res = await fetch(`h${API_BASE}/api/prodotti/${id}`, {
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
          const res = await fetch(`${API_BASE}/api/prodotti`, {
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
            const testoErr = await res.text();
            await Swal.fire({
              icon: 'error',
              title: 'Errore salvataggio online',
              text: testoErr || 'Impossibile creare il prodotto.'
            });
          }
        }
      } catch (err:any) {
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
      } as Prodotto;

      await saveProdotto(offline);
      await Swal.fire({
                icon: 'warning',
                title: isModifica
                  ? 'Modifica salvata offline'
                  : 'Prodotto salvato offline',
                text: 'Le modifiche verranno sincronizzate quando torni online.',
                timer: 1400,
                showConfirmButton: false,
              });
    }

    const locali = await getAllProdotti();
    setProdotti(locali);
    setEditing(null);
    setOpen(false);
  };

    // funzione per cancellare in massa
  const handleBulkDeleteProdotti = async () => {
    for (const id of rowSelectionModel.ids) {
      await handleDelete(Number(id));
    }
    // poi ricarichi i dati
    await ricaricaDati();
    // pulisci la selezione
    setRowSelectionModel({ type: 'include', ids: new Set() });
  };

  // filtri
  // const prodottiFiltrati = prodotti.filter(p =>
  //   p.nome.toLowerCase().includes(query.toLowerCase()) ||
  //   p.varieta.toLowerCase().includes(query.toLowerCase()) ||
  //   p.calibro.toLowerCase().includes(query.toLowerCase()) ||
  //   p.colore.toLowerCase().includes(query.toLowerCase())
  // );

  const prodottiFiltrati = useMemo(() =>
    prodotti
    .slice()
    .sort((a, b) => a.id - b.id)
            .filter(p => {
    const lower = query.toLowerCase();
    // match by name, variety, calibre, id, or "id - name"
    const matchesText =
      p.nome.toLowerCase().includes(lower)
      || p.varieta.toLowerCase().includes(lower)
      || p.calibro.toLowerCase().includes(lower)
      || p.id.toString().includes(lower)
      || (`${p.id} - ${p.nome}`).toLowerCase().includes(lower);
    if (!matchesText) return false;
    const created = new Date(p.createdAt ?? '');
        if (filterFrom && created < new Date(filterFrom)) return false;
        if (filterTo && created > new Date(filterTo)) return false;
        return true;
 }), [prodotti, query, filterFrom, filterTo]);

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
              focusConfirm: false,   // non mettere subito a fuoco il Confirm
              focusCancel: true,     // metti a fuoco prima il Cancel
              allowEnterKey: true,   // abilita Enter per confermare
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
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>Gestione Prodotti</Typography>
        <Button className='btn' variant="contained" onClick={() => { setEditing(null); setOpen(true); }} > Aggiungi Prodotto </Button>
      </Box>

      {/* Ricerca Prodotto */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Autocomplete
          size="small"
          freeSolo
          //disableClearable
          popupIcon={<ExpandMoreIcon />}
          options={prodotti.map(p => `${p.id} - ${p.nome}`)}
          inputValue={query}
          value={query}
          onInputChange={(_, newInput) => setQuery(newInput)}
          onChange={(_, newValue) => setQuery(newValue || '')}
          blurOnSelect
          autoHighlight
          renderInput={params => (
            <TextField
              {...params}
              className='input-tondi'
              variant="outlined"
              label="Cerca prodotto"
              size="small"
            />
          )}
          sx={{ mb: 3, mt: 2, width: 200, padding: '8.5px 0' }}
        />
        <TextField className='input-tondi' label="Da" type="date" InputLabelProps={{ shrink: true }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} size="small" sx={{ mb: 3, mt: 2, width: 200 }} />
        <TextField className='input-tondi' label="A" type="date" InputLabelProps={{ shrink: true }} value={filterTo} onChange={e => setFilterTo(e.target.value)} size="small" sx={{ mb: 3, mt: 2, width: 200 }} />
        <Button color="error" size="small" onClick={() => { setQuery(''); setFilterFrom(''); setFilterTo(''); }} sx={{ mb: 3, mt: 2, width: 200 }} >
          <DeleteForeverIcon />
        </Button>
      </Box>


      {/* Tabella Prodotti */}
      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <Stack direction="row" spacing={1} mb={1}>
          <Button
            className='btn-elimina-selezionati'
            variant="outlined"
            color="error"
            disabled={rowSelectionModel.ids.size === 0}
            onClick={async () => {
            const result = await Swal.fire({
              title: `Eliminare ${rowSelectionModel.ids.size} prodotti?`,
              text: 'Operazione irreversibile',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, elimina',
              cancelButtonText: 'No, annulla',
              reverseButtons: true
            });
            if (result.isConfirmed) {
              await handleBulkDeleteProdotti();
              await Swal.fire('Eliminati!', '', 'success');
            }
          }}
          >
            Elimina selezionati ({rowSelectionModel.ids.size})
          </Button>
        </Stack>
        <DataGrid
          rows={prodottiFiltrati}
          columns={columns}
          getRowId={(row) => row.id!}
          checkboxSelection
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(model: GridRowSelectionModel) => {
            setRowSelectionModel(model);
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'asc' }],
            },
            pagination: { paginationModel: { pageSize: 10, page: 0 } }
          }}
          pageSizeOptions={[10, 25, 100]}
          sx={{
            borderRadius: '32px',
            padding: '1em',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
          }}
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