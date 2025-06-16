import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress, TextField, Stack } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { handlePrint } from '../../utils/printBolla';

import AddBollaDialog from '../../components/addBollaDialog';
import useBolleSync from '../../sync/useBolleSync';

import { getAllBolle, saveBolla, deleteBolla as deleteLocalBolla, type Bolla, getBolleEliminate } from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { getAllProdotti, type Prodotto } from '../../storage/prodottiDB';
import { getAllImballaggi, type Imballaggio } from '../../storage/imballaggiDB';

import Swal from 'sweetalert2';

export default function Bolle() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  });

  // dati all'interno della bolla dai vari componenti
  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bolla | null>(null);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [loading, setLoading] = useState(true);

  // ricarica dati bolla -> dovrebbe anche sistemare il problema dell'eliminazione offline/online
  const ricaricaDati = async () => {
    const [bolleData, clientiData, prodottiData, imballaggiData] = await Promise.all([
      getAllBolle(),
      getAllClienti(),
      getAllProdotti(),
      getAllImballaggi()
    ]);
    // id eliminati
    const eliminatiIds = (await getBolleEliminate()).map(b => b.id);
    // filtra le bolle visibili dopo l'eliminazione
    const bolleVisibili = bolleData
      .filter(b => b.id !== undefined)
      .filter(b => !eliminatiIds.includes(b.id!));
    
    setBolle(bolleVisibili);
    setClienti(clientiData);
    setProdotti(prodottiData);
    setImballaggi(imballaggiData);
  };

  useEffect(() => {
    (async () => {
      await ricaricaDati();
      setLoading(false);
    })();
  }, []);

  useBolleSync();

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/bolle/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await deleteLocalBolla(id); // elimina le bolle online
        } else {
          const errText = await response.text();
          await Swal.fire({
          icon: 'error',
          title: 'Errore durante la cancellazione online',
          text: errText || 'Si è verificato un problema sul server.'
          });
        }
      } catch (err: any){
        await Swal.fire({
          icon: 'error',
          title: 'Errore di rete',
          text: err.message || 'Impossibile contattare il server.'
        });
      }
    } else {
      await markBollaAsDeleted(id); // elimina le bolle offline
      await Swal.fire({
        icon: 'warning',
        title: 'Eliminazione offline',
        text: 'La bolla è stata rimossa localmente e sarà sincronizzata al ritorno online.',
        timer: 1400,
        showConfirmButton: false,
        focusConfirm: false,   // non mettere subito a fuoco il Confirm
        focusCancel: true,     // metti a fuoco prima il Cancel
        allowEnterKey: true,   // abilita Enter per confermare
      });
    }
    await ricaricaDati();
  };

  // funzione per cancellare in massa
  const handleBulkDeleteBolle = async () => {
    for (const id of rowSelectionModel.ids) {
      await handleDelete(Number(id));
    }
    // poi ricarichi i dati
    await ricaricaDati();
    // pulisci la selezione
    setRowSelectionModel({ type: 'include', ids: new Set() });
  };

  // filtri per tabella bolle
  const [filterNumero, setFilterNumero] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(''); // ISO yyyy-MM-dd
  const [dateTo, setDateTo]   = useState<string>('');
  
  // funzione per i filtri da mettere in <DataGrid>
  // filtraggio combinato
  const filteredBolle = bolle.filter((b) => {
    // filtro per numero bolla
    const matchNumero = filterNumero
      ? b.numeroBolla.toString().includes(filterNumero)
      : true;
    // filtro per cliente, se vuoto passa tutto
    const byCliente = filterCliente
      ? b.destinatarioNome.toLowerCase().includes(filterCliente.toLowerCase())
      : true;

    // filtro per date
    const dataBolla = new Date(b.dataOra);
    const fromOK = dateFrom ? dataBolla >= new Date(dateFrom) : true;
    const toOK   = dateTo   ? dataBolla <= new Date(dateTo)   : true;

    return matchNumero && byCliente && fromOK && toOK;
  });

  // tabella bolle
  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOra', headerName: 'Data', width: 150 },
    { field: 'destinatarioNome', headerName: 'Destinatario', width: 200 },
    { field: 'indirizzoDestinazione', headerName: 'Indirizzo di Destinazione', width: 250 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      renderCell: params => (
        <>
          <IconButton onClick={() => { setEditing(params.row); setOpen(true); }}><EditIcon/></IconButton>
          {/* <IconButton onClick={() => handleDelete(params.row.id)}><DeleteIcon/></IconButton> */}
          <IconButton onClick={() => {
            Swal.fire({
                title: `Eliminare la bolla n. ${params.row.numeroBolla}?`,
                text: "Questa operazione non può essere annullata.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sì, elimina',
                cancelButtonText: 'No, annulla',
                reverseButtons: true,
                focusConfirm: false,   // non mettere subito a fuoco il Confirm
                focusCancel: true,     // metti a fuoco prima il Cancel
                allowEnterKey: true,   // abilita Enter per confermare
              }).then((result) => {
                if (result.isConfirmed) {
                  handleDelete(params.row.id);
                  Swal.fire(
                    'Eliminata!',
                    `La bolla n. ${params.row.numeroBolla} è stata eliminata.`,
                    'success'
                  );
                }
              });
            }}>
            <DeleteIcon />
          </IconButton>
          <IconButton
  onClick={(e) => {
    e.stopPropagation();           // blocca la selezione della riga
    handlePrint(params.row);       // esegue la stampa
  }}
>
  <PrintIcon />
</IconButton>
        </>
      )
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>Gestione Bolle</Typography>
        <Button variant="contained" className='btn'
          onClick={() => {
            if (clienti.length && prodotti.length && imballaggi.length) {
              setEditing(null); setOpen(true);
            } else {
              alert("⏳ Attendi il caricamento dei dati prima di aggiungere una bolla.");
            }
          }}
        > Aggiungi Bolla</Button>
      </Box>

      {/* Filtri  */}
      <Box display="flex" alignItems="center" gap={2} mb={5} mt={5}>
        <Button variant="contained" onClick={() => { setFilterCliente(''); setDateFrom(''); setDateTo(''); }} className='btn'> Tutti </Button>
        <TextField size="small" label="N. bolla" value={filterNumero} onChange={e => setFilterNumero(e.target.value)} className='input-tondi'/>
        <TextField size="small" label="Nome Cliente" value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className='input-tondi'/>
        <TextField size="small" label="Da" type="date" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} className='input-tondi'/>
        <TextField size="small" label="A" type="date" InputLabelProps={{ shrink: true }} value={dateTo} onChange={e => setDateTo(e.target.value)} className='input-tondi'/>
        <Button color="error" onClick={() => { setFilterCliente(''); setDateFrom(''); setDateTo(''); }} > <DeleteForeverIcon/> </Button>
      </Box>

      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <Stack direction="row" spacing={1} mb={1}>
          <Button
            className='btn-elimina-selezionati'
            variant="outlined"
            color="error"
            disabled={rowSelectionModel.ids.size === 0}
            onClick={async () => {
            const result = await Swal.fire({
              title: `Eliminare ${rowSelectionModel.ids.size} bolle?`,
              text: 'Operazione irreversibile',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, elimina',
              cancelButtonText: 'No, annulla',
              reverseButtons: true
            });
            if (result.isConfirmed) {
              await handleBulkDeleteBolle();
              await Swal.fire('Eliminati!', '', 'success');
            }
          }}
          >
            Elimina selezionati ({rowSelectionModel.ids.size})
          </Button>
        </Stack>
        <DataGrid 
          rows={filteredBolle} 
          columns={columns} 
          getRowId={row => row.id!} 
          checkboxSelection
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(model: GridRowSelectionModel) => {
            setRowSelectionModel(model);
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'asc' }],
            },
            pagination: { paginationModel: { pageSize: 25, page: 0 } }
          }}
          pageSizeOptions={[25, 50, 100]}
          sx={{borderRadius: '32px', padding: '1em'}}
        />
      </div>

      <AddBollaDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        bolla={editing}
        onSave={async bolla => {
          if (navigator.onLine) {
            try {
              const res = bolla.id
                ? await fetch(`http://localhost:4000/api/bolle/${bolla.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(bolla)
                  })
                : await fetch('http://localhost:4000/api/bolle', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(bolla)
                  });

              if (res.ok) {
                const nb = await res.json();
                await saveBolla({...nb, synced:true, modifiedOffline:false});
              } else {
                console.error(await res.text());
                await saveBolla({...bolla, synced:false, modifiedOffline:!!bolla.id});
              }
            } catch {
              await saveBolla({...bolla, synced:false, modifiedOffline:!!bolla.id});
            }
          } else {
            const tempId = Date.now();
            await saveBolla({...bolla, id:bolla.id||tempId, synced:false, modifiedOffline:!!bolla.id});
          }
          await ricaricaDati();
          setOpen(false);
        }}
        clienti={clienti}
        prodotti={prodotti}
        imballaggi={imballaggi}
        numeroBolla={bolle.length > 0 ? Math.max(...bolle.map(b=>b.numeroBolla))+1 : 1}
      />
    </Box>
  );
}