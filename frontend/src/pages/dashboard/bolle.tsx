import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress, TextField, Stack, Autocomplete } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EmailIcon from '@mui/icons-material/Email';
import { handlePrint, generatePDFBase64 } from '../../utils/printBolla';

import AddBollaDialog from '../../components/addBollaDialog';
import useBolleSync from '../../sync/useBolleSync';

import { getAllBolle, saveBolla, deleteBolla as deleteLocalBolla, type Bolla, getBolleEliminate } from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { getAllProdotti, type Prodotto } from '../../storage/prodottiDB';
import { getAllImballaggi, type Imballaggio } from '../../storage/imballaggiDB';

import { saveAs } from 'file-saver';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import Swal from 'sweetalert2';

import { getBaseUrl } from '../../lib/getBaseUrl';


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

  // Stati per modalità speciali bolla
  const [isBollaBis, setIsBollaBis] = useState(false);
  const [isBollaGenerica, setIsBollaGenerica] = useState(false);

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
        const response = await fetch(`${getBaseUrl()}/bolle/${id}`, { method: 'DELETE' });
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

  // Funzione per inviare email
  const handleSendEmail = async (bolla: Bolla) => {
    try {
      // Genera PDF come base64
      const pdfBase64 = await generatePDFBase64(bolla);

      // Invia richiesta al backend
      const response = await fetch(`${getBaseUrl()}/bolle/${bolla.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfBase64 }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'invio dell\'email');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Email inviate!',
        text: 'Le email sono state inviate al cliente e al corriere.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Errore invio email:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Errore',
        text: error.message || 'Impossibile inviare le email.',
      });
    }
  };

  // funzione per cancellare in massa
  // const handleBulkDeleteBolle = async () => {
  //   for (const id of rowSelectionModel.ids) {
  //     await handleDelete(Number(id));
  //   }
  //   // poi ricarichi i dati
  //   await ricaricaDati();
  //   // pulisci la selezione
  //   setRowSelectionModel({ type: 'include', ids: new Set() });
  // };

  // filtri per tabella bolle
  const [filterNumero, setFilterNumero] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [openFilterCliente, setOpenFilterCliente] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>(''); // ISO yyyy-MM-dd
  const [dateTo, setDateTo]   = useState<string>('');
  
  // funzione per formattare le date delle bolle
  const formattaData = (data: string) => {
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // funzione per i filtri da mettere in <DataGrid>
  // filtraggio combinato e aggiunta campo dataOraFormatted
  const filteredBolle = bolle
    .filter((b) => {
      const matchNumero = filterNumero
        ? b.numeroBolla.toString().includes(filterNumero)
        : true;
      const byCliente = filterCliente
        ? (`${b.destinatarioNome || ''}`.toLowerCase().includes(filterCliente.toLowerCase()))
        : true;
      const dataBolla = new Date(b.dataOra);
      const fromOK = dateFrom
        ? dataBolla >= new Date(dateFrom)
        : true;
      const toOK = dateTo
        ? dataBolla <= new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        : true;

      return matchNumero && byCliente && fromOK && toOK;
    })
    .map(b => ({
      ...b,
      dataOraFormatted: formattaData(b.dataOra)
    }));

  // tabella bolle
  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    {
      field: 'dataOraFormatted',
      headerName: 'Data',
      width: 150
    },
    { field: 'destinatarioNome', headerName: 'Destinatario', width: 200 },
    { field: 'indirizzoDestinazione', headerName: 'Indirizzo di Destinazione', width: 200 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 250,
      renderCell: params => (
        <>
          <IconButton onClick={() => {
            if (params.row.numeroBolla?.toString().includes('/generica')) {
              setIsBollaGenerica(true);
              setIsBollaBis(false);
            } else {
              setIsBollaGenerica(false);
              setIsBollaBis(false);
            }
            setEditing(params.row);
            setOpen(true);
          }}><EditIcon/></IconButton>
          {/* Bolla Bis accanto alla matita */}
          <IconButton onClick={() => { setEditing(params.row); setIsBollaBis(true); setIsBollaGenerica(false); setOpen(true); }}>
            <Typography variant="caption" fontWeight="bold">Bis</Typography>
          </IconButton>
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
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleSendEmail(params.row);
            }}
          >
            <EmailIcon />
          </IconButton>
        </>
      )
    }
  ];

  const exportSelectedCSV = async () => {
    // get selected IDs as numbers
    const selectedIds = Array.from(rowSelectionModel.ids).map(id => Number(id));
    // filter only selected bolle
    const selected = bolle.filter(b => b.id !== undefined && selectedIds.includes(b.id));
    // build CSV
    let csv = 'NumeroBolla,DataOra,Destinatario,IndirizzoDestinazione,Causale,NProdotti,TotKgSpediti\n';
    selected.forEach(b => {
      const prodottiArr = JSON.parse(b.prodotti) as Array<{ totKgSpediti: number }>;
      const nProd = prodottiArr.length;
      const totKg = prodottiArr.reduce((sum, p) => sum + p.totKgSpediti, 0);
      csv += [
        b.numeroBolla,
        b.dataOra,
        `"${(b.destinatarioNome ?? '').replace(/"/g,'""')}"`,
        `"${(b.indirizzoDestinazione ?? '').replace(/"/g,'""')}"`,
        b.causale,
        nProd,
        totKg
      ].join(',') + '\n';
    });
    // trigger download
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'tabella_bolle.csv');
  };

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
        <Box display="flex" gap={2}>
          <Button variant="contained" className='btn'
            onClick={() => {
              if (clienti.length && prodotti.length && imballaggi.length) {
                setEditing(null); setIsBollaBis(false); setIsBollaGenerica(false); setOpen(true);
              } else {
                alert("⏳ Attendi il caricamento dei dati prima di aggiungere una bolla.");
              }
            }}
          > Aggiungi Bolla</Button>
          <Button variant="outlined" className='btn' onClick={() => { setIsBollaGenerica(true); setIsBollaBis(false); setEditing(null); setOpen(true); }}>
            Bolla Generica
          </Button>
        </Box>
      </Box>

      {/* Filtri  */}
      <Box display="flex" alignItems="center" gap={2} mb={5} mt={5}>
        <Button variant="contained" onClick={() => { setFilterNumero(''); setFilterCliente(''); setDateFrom(''); setDateTo(''); }} className='btn'> Tutti </Button>
        <TextField size="small" label="N. bolla" value={filterNumero} onChange={e => setFilterNumero(e.target.value)} className='input-tondi'/>
        <Autocomplete
          size="small"
          sx={{  mb: 2, mt: 2, width: 200, padding: '0'  }}
          open={openFilterCliente}
          onOpen={() => setOpenFilterCliente(true)}
          onClose={() => setOpenFilterCliente(false)}
          options={clienti}
          getOptionLabel={c => `${c.id} - ${c.nomeCliente} ${c.cognomeCliente} `}
          value={clienti.find(c => `${c.nomeCliente} ${c.cognomeCliente}` === filterCliente) || null}
          onChange={(_, newValue) => setFilterCliente(newValue ? `${newValue.nomeCliente} ${newValue.cognomeCliente}` : '')}
          autoHighlight
          blurOnSelect
          renderInput={params => (
            <TextField
              {...params}
              className='input-tondi'
              variant="outlined"
              label="Cliente"
              size="small"
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
              }}
            />
          )}
        />
        <TextField size="small" label="Da" type="date" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} className='input-tondi'/>
        <TextField size="small" label="A" type="date" InputLabelProps={{ shrink: true }} value={dateTo} onChange={e => setDateTo(e.target.value)} className='input-tondi'/>
        <Button color="error" onClick={() => { setFilterNumero(''); setFilterCliente(''); setDateFrom(''); setDateTo(''); }} > <DeleteForeverIcon/> </Button>

       
      </Box>

      <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
        <Stack direction="row" display='flex' justifyContent='space-between' spacing={1} mb={1}>
          {/* <Button
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
          </Button> */}

          <Button onClick={exportSelectedCSV} disabled={rowSelectionModel.ids.size === 0}>
            <FileDownloadIcon color="success"/>
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
            pagination: { paginationModel: { pageSize: 100, page: 0 } }
          }}
          pageSizeOptions={[100, 200, 250]}
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

      <AddBollaDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); setIsBollaBis(false); setIsBollaGenerica(false); }}
        bolla={editing}
        onSave={async bolla => {
          if (navigator.onLine) {
            try {
              const res = bolla.id
                ? await fetch(`${getBaseUrl()}/bolle/${bolla.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(bolla)
                  })
                : await fetch(`${getBaseUrl()}/bolle`, {
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
        numeroBolla={
          (() => {
            const numeriBolle = bolle
              .map(b => {
                const numero = b.numeroBolla.toString().split('/')[0];
                return parseInt(numero, 10) || 0;
              })
              .filter(nb => !isNaN(nb));
            const maxNumero = numeriBolle.length > 0 ? Math.max(...numeriBolle) : 255;
            return Math.max(maxNumero, 255) + 1;
          })()
        }
        isBollaBis={isBollaBis}
        isBollaGenerica={isBollaGenerica}
      />
    </Box>
  );
}
