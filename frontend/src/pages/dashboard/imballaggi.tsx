import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField, Stack } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { API_BASE } from '../../api/user';

import AddImballaggioDialog from '../../components/addImballaggioDialog';

import useImballaggiSync from '../../sync/useImballaggiSync';
import { saveImballaggio, deleteImballaggio as deleteLocalImballaggio, getAllImballaggi, markImballaggiAsDeleted } from '../../storage/imballaggiDB';
import Swal from 'sweetalert2';

import Autocomplete from '@mui/material/Autocomplete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  });

  const [query, setQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imballaggio | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch(`${API_BASE}/api/imballaggi`);
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
        const response = await fetch(`${API_BASE}/api/imballaggi/${id}`, {
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
          showConfirmButton: false,
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
          const res = await fetch(`${API_BASE}/api/imballaggi/${id}`, {
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
          const res = await fetch(`${API_BASE}/api/imballaggi`, {
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

    // funzione per cancellare in massa
  const handleBulkDeleteImballaggi = async () => {
    for (const id of rowSelectionModel.ids) {
      await handleDelete(Number(id));
    }
    // poi ricarichi i dati
    await ricaricaDati();
    // pulisci la selezione
    setRowSelectionModel({ type: 'include', ids: new Set() });
  };
  

  // filtri
  // const imballaggiFiltrati = imballaggi.filter(i =>
  //   i.tipo.toLowerCase().includes(query.toLowerCase()) ||
  //   i.dimensioni.toLowerCase().includes(query.toLowerCase()) ||
  //   String(i.capacitaKg).includes(query)
  // );

  const imballaggiFiltrati = useMemo(() =>
    imballaggi
    .slice()
    .sort((a, b) => a.id - b.id)
            .filter(i => {
    const lower = query.toLowerCase();
    const matchesText =
      i.tipo.toLowerCase().includes(lower)
      || i.dimensioni.toLowerCase().includes(lower)
      || i.id.toString().includes(lower)
      || (`${i.id} - ${i.tipo}`).toLowerCase().includes(lower);
    if (!matchesText) return false;
    const created = new Date(i.createdAt ?? '');
        if (filterFrom && created < new Date(filterFrom)) return false;
        if (filterTo && created > new Date(filterTo)) return false;
        return true;
 }), [imballaggi, query, filterFrom, filterTo]);

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
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>Gestione Imballaggi</Typography>
        <Button variant="contained" className='btn' onClick={() => { setEditing(null); setOpen(true); }} > Aggiungi Imballaggio </Button>
      </Box>

      {/* Ricerca Imballaggio */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Autocomplete
          size="small"
          freeSolo
          //disableClearable
          popupIcon={<ExpandMoreIcon />}
          options={imballaggi.map(i => `${i.id} - ${i.tipo}`)}
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
              label="Cerca imballaggio"
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

      {/* Tabella Imballaggi */}
      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
         <Stack direction="row" spacing={1} mb={1}>
            <Button
              className='btn-elimina-selezionati'
              variant="outlined"
              color="error"
              disabled={rowSelectionModel.ids.size === 0}
              onClick={async () => {
              const result = await Swal.fire({
                title: `Eliminare ${rowSelectionModel.ids.size} imballaggi?`,
                text: 'Operazione irreversibile',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sì, elimina',
                cancelButtonText: 'No, annulla',
                reverseButtons: true
              });
              if (result.isConfirmed) {
                await handleBulkDeleteImballaggi();
                await Swal.fire('Eliminati!', '', 'success');
              }
            }}
            >
              Elimina selezionati ({rowSelectionModel.ids.size})
            </Button>
          </Stack>
        <DataGrid
          rows={imballaggiFiltrati}
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