import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, Stack, TextField, Autocomplete, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { handlePrint } from '../../utils/printBolla';
import { getAllBolle, type Bolla } from '../../storage/bolleDB';
import { getBolleEliminate } from '../../storage/bolleEliminateDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { saveAs } from 'file-saver';

export default function Archivio() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  });

  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [annoSelezionato, setAnnoSelezionato] = useState<number | null>(null);
  const [anniDisponibili, setAnniDisponibili] = useState<number[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [filterNumero, setFilterNumero] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [openFilterCliente, setOpenFilterCliente] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [bolleData, clientiData] = await Promise.all([
        getAllBolle(),
        getAllClienti()
      ]);
      const eliminatiIds = (await getBolleEliminate()).map(b => b.id);

      const bolleVisibili = bolleData
        .filter(b => b.id !== undefined)
        .filter(b => !eliminatiIds.includes(b.id!));

      const anni = Array.from(new Set(
        bolleVisibili.map(b => new Date(b.dataOra).getFullYear())
      )).sort((a, b) => a - b); // Ordinamento crescente

      // Aggiungi gli anni futuri fino all'anno corrente + 1
      const annoCorrente = new Date().getFullYear();
      const annoFuturo = annoCorrente + 1;
      if (!anni.includes(annoFuturo)) {
        anni.push(annoFuturo);
      }

      setAnniDisponibili(anni);
      setClienti(clientiData);

      if (anni.length > 0) {
        setAnnoSelezionato(anni[anni.length - 1]); // Seleziona l'anno più recente
      }

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (annoSelezionato === null) return;

    (async () => {
      const bolleData = await getAllBolle();
      const eliminatiIds = (await getBolleEliminate()).map(b => b.id);

      const bolleAnno = bolleData
        .filter(b => b.id !== undefined)
        .filter(b => !eliminatiIds.includes(b.id!))
        .filter(b => {
          const dataOra = new Date(b.dataOra);
          return dataOra.getFullYear() === annoSelezionato;
        });

      setBolle(bolleAnno);
    })();
  }, [annoSelezionato]);

  const formattaData = (data: string) => {
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleBulkPrint = () => {
    const selectedIds = Array.from(rowSelectionModel.ids).map(id => Number(id));
    const selectedBolle = bolle.filter(b => b.id !== undefined && selectedIds.includes(b.id));
    selectedBolle.forEach(bolla => {
      setTimeout(() => handlePrint(bolla), 100);
    });
  };

  const handleExportCSV = () => {
    const selectedIds = Array.from(rowSelectionModel.ids).map(id => Number(id));
    const selectedBolle = selectedIds.length > 0
      ? bolle.filter(b => b.id !== undefined && selectedIds.includes(b.id))
      : filteredBolle;

    const headers = ['Numero Bolla', 'Data', 'Cliente', 'Causale', 'Vettore'];
    const rows = selectedBolle.map(b => [
      b.numeroBolla,
      formattaData(b.dataOra),
      `${b.destinatarioNome || ''} ${b.destinatarioCognome || ''}`.trim(),
      b.causale,
      b.vettore
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `archivio_bolle_${annoSelezionato}.csv`);
  };

  const filteredBolle = bolle
    .filter((b) => {
      const matchNumero = filterNumero ? b.numeroBolla.toString().includes(filterNumero) : true;
      const byCliente = filterCliente ? (`${b.destinatarioNome || ''}`.toLowerCase().includes(filterCliente.toLowerCase())) : true;
      const dataBolla = new Date(b.dataOra);
      const fromOK = dateFrom ? dataBolla >= new Date(dateFrom) : true;
      const toOK = dateTo ? dataBolla <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : true;
      return matchNumero && byCliente && fromOK && toOK;
    })
    .map(b => ({
      ...b,
      dataOraFormatted: formattaData(b.dataOra)
    }));

  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOraFormatted', headerName: 'Data', width: 150 },
    { field: 'destinatarioNome', headerName: 'Cliente', width: 200 },
    { field: 'causale', headerName: 'Causale', width: 200 },
    { field: 'vettore', headerName: 'Vettore', width: 150 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 100,
      renderCell: params => (
        <IconButton onClick={() => handlePrint(params.row)}>
          <PrintIcon />
        </IconButton>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>Archivio Bolle</Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {anniDisponibili.map(anno => (
          <Button
            key={anno}
            variant="contained"
            onClick={() => setAnnoSelezionato(anno)}
            className='btn'
            style={annoSelezionato !== anno ? {
              backgroundColor: '#9e9e9e'
            } : {}}
            sx={annoSelezionato !== anno ? {
              '&:hover': {
                backgroundColor: '#757575'
              }
            } : {}}
          >
            {anno}
          </Button>
        ))}
      </Stack>

      {annoSelezionato !== null && (
        <>
          {/* Filtri */}
          <Box display="flex" alignItems="center" gap={2} mb={5} mt={5}>
            <Button
              variant="contained"
              onClick={() => { setFilterNumero(''); setFilterCliente(''); setDateFrom(''); setDateTo(''); }}
              className='btn'
            >
              Tutti
            </Button>
            <TextField
              size="small"
              label="N. bolla"
              value={filterNumero}
              onChange={e => setFilterNumero(e.target.value)}
              className='input-tondi'
            />
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
            <TextField
              size="small"
              label="Da"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className='input-tondi'
            />
            <TextField
              size="small"
              label="A"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className='input-tondi'
            />
            <Button
              color="error"
              onClick={() => { setFilterNumero(''); setFilterCliente(''); setDateFrom(''); setDateTo(''); }}
            >
              <DeleteForeverIcon/>
            </Button>
          </Box>

          <div style={{ minHeight: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))' }}>
            <Stack direction="row" display='flex' justifyContent='space-between' spacing={1} mb={1}>
              <Button
                onClick={handleBulkPrint}
                disabled={rowSelectionModel.ids.size === 0}
              >
                <PrintIcon color="primary"/>
              </Button>

              <Button
                onClick={handleExportCSV}
                disabled={rowSelectionModel.ids.size === 0}
              >
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
                  sortModel: [{ field: 'id', sort: 'desc' }],
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
        </>
      )}

      {anniDisponibili.length === 0 && (
        <Typography>Nessun anno disponibile nell'archivio</Typography>
      )}
    </Box>
  );
}
