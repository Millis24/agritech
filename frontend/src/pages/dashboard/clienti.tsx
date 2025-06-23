import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField, Stack, Autocomplete } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import SchedaClienteDialog from '../../components/schedaClienteDialog.tsx';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import AddClienteDialog from '../../components/addClienteDialog';
import type { Cliente } from '../../components/addClienteDialog';

import useClientiSync from '../../sync/useClientiSync';
import { saveCliente, deleteCliente as deleteLocalCliente, getAllClienti, markClienteAsDeleted } from '../../storage/clientiDB';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { saveAs } from 'file-saver';

import { getBaseUrl } from '../../lib/getBaseUrl';


export default function Clienti() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  });
  
  const [query, setQuery] = useState('');
  const [openFilterCliente, setOpenFilterCliente] = useState(false);
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const ricaricaDati = async () => {
    if (navigator.onLine) {
      try {
        const res = await fetch(`${getBaseUrl()}/clienti`);
        if (!res.ok) throw new Error(`Server risponde con ${res.status}`);
        const datiOnline = await res.json();
        setClienti(datiOnline);
      } catch (e) {
        console.error('❌ Errore nel caricamento online, provo offline');
        const locali = await getAllClienti();
        const sorted = locali.slice().sort((a,b) => a.id - b.id);
        setClienti(sorted);
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
        const response = await fetch(`${getBaseUrl()}/clienti/${id}`, {
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

  const handleSave = async (cliente: Partial<Cliente>): Promise<Cliente> => {
    const isModifica = !!editing;
    const { id, createdAt, synced, ...dataToSend } = cliente;

    if (navigator.onLine) {
      try {
        if (isModifica && id !== undefined) {
          const res = await fetch(`${getBaseUrl()}/clienti/${id}`, {
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
          const res = await fetch(`${getBaseUrl()}/clienti`, {
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
    // Restituisci il cliente come Cliente prima di chiudere il dialog/modifica
    return cliente as Cliente;
    setEditing(null);
    setOpen(false);
  };

  // funzione per cancellare in massa
  const handleBulkDeleteClienti = async () => {
    for (const id of Array.from(rowSelectionModel.ids) as GridRowId[]) {
      await handleDelete(Number(id));
    }
    // poi ricarichi i dati
    await ricaricaDati();
    // pulisci la selezione
    setRowSelectionModel({ type: 'include', ids: new Set() });
  };

  const exportSelectedClientsCSV = async () => {
    // prendi solo gli ID selezionati
    const selectedIds = Array.from(rowSelectionModel.ids).map(id => Number(id));
    const selected = clienti.filter(c => selectedIds.includes(c.id));
    // costruisci il CSV con i nuovi campi indirizzo
    let csv = 'id,nomeCliente,cognomeCliente,ragioneSociale,partitaIva,via,numeroCivico,paese,provincia,cap,codiceSDI,telefonoCell,email\n';
    selected.forEach(c => {
      csv += [
        c.id,
        `"${c.nomeCliente.replace(/"/g,'""')}"`,
        `"${c.cognomeCliente.replace(/"/g,'""')}"`,
        `"${c.ragioneSociale.replace(/"/g,'""')}"`,
        `"${c.partitaIva.replace(/"/g,'""')}"`,
        `"${c.via.replace(/"/g,'""')}"`,
        `"${c.numeroCivico.replace(/"/g,'""')}"`,
        `"${c.paese.replace(/"/g,'""')}"`,
        `"${c.provincia.replace(/"/g,'""')}"`,
        `"${c.cap.replace(/"/g,'""')}"`,
        c.codiceSDI,
        c.telefonoCell,
        c.email
      ].join(',') + '\n';
    });
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'tabella_clienti.csv');
  };
  
  // filtri
  const clientiFiltrati = useMemo(() => 
    clienti
      .slice()                  // clona, per non mutare lo stato originale
      .sort((a, b) => a.id - b.id)
      .filter(c => {
        // text search
        const lower = query.toLowerCase();
        // check by name, ragione sociale, id, or full "id - nome"
        const matchesText = 
          c.nomeCliente.toLowerCase().includes(lower)
          || c.ragioneSociale.toLowerCase().includes(lower)
          || c.id.toString().includes(lower)
          || (`${c.id} - ${c.nomeCliente}`).toLowerCase().includes(lower);
        if (!matchesText) return false;
        // date filter on createdAt (if field exists)
        const created = new Date(c.createdAt ?? '');
        if (filterFrom && created < new Date(filterFrom)) return false;
        if (filterTo && created > new Date(filterTo)) return false;
        return true;
      })
  , [clienti, query, filterFrom, filterTo]);

  // colonne tabella
  const columns: GridColDef[] = [
    { field: 'nomeCliente', headerName: 'Nome', width: 150 },
    { field: 'cognomeCliente', headerName: 'Cognome', width: 150 },
    { field: 'ragioneSociale', headerName: 'Ragione Sociale', width: 200 },
    { field: 'via', headerName: 'Via', width: 150 },
    { field: 'numeroCivico', headerName: 'Civico', width: 100 },
    { field: 'paese', headerName: 'Paese', width: 150 },
    { field: 'provincia', headerName: 'Provincia', width: 100 },
    { field: 'cap', headerName: 'CAP', width: 100 },
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
        <Button className='btn' variant="contained"  onClick={() => { setEditing(null); setOpen(true); }} > Aggiungi Cliente </Button>
      </Box>

      {/* Ricerca Cliente */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Autocomplete
          size="small"
          freeSolo
          //disableClearable
          blurOnSelect
          popupIcon={<ExpandMoreIcon />}
          open={openFilterCliente}
          onOpen={() => setOpenFilterCliente(true)}
          onClose={() => setOpenFilterCliente(false)}
          options={clienti.map(c => `${c.id} - ${c.nomeCliente}`)}
          inputValue={query}
          value={query}
          onInputChange={(_, newInput) => setQuery(newInput)}
          onChange={(_, newValue) => {
            if (newValue) {
              // extract the name part after ' - '
              const parts = newValue.split(' - ');
              setQuery(parts.slice(1).join(' - '));
            } else {
              setQuery('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // commit the highlighted option if any
              e.preventDefault();
              setOpenFilterCliente(false);
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              className='input-tondi'
              variant="outlined"
              label="Cliente"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: params.InputProps.endAdornment,
              }}
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



      {/* Tabella Clienti */}
      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <Stack direction="row" display='flex' justifyContent='space-between'  spacing={1} mb={1}>
          <Button
            className='btn-elimina-selezionati'
            variant="outlined"
            color="error"
            disabled={rowSelectionModel.ids.size === 0}
            onClick={async () => {
            const result = await Swal.fire({
              title: `Eliminare ${rowSelectionModel.ids.size} clienti?`,
              text: 'Operazione irreversibile',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, elimina',
              cancelButtonText: 'No, annulla',
              reverseButtons: true
            });
            if (result.isConfirmed) {
              await handleBulkDeleteClienti();
              await Swal.fire('Eliminati!', '', 'success');
            }
          }}
          >
            Elimina selezionati ({rowSelectionModel.ids.size})
          </Button>

          <Button onClick={exportSelectedClientsCSV} disabled={rowSelectionModel.ids.size === 0}>
            <FileDownloadIcon color="success"/>
          </Button>
        </Stack>
        <DataGrid
          rows={clientiFiltrati}
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