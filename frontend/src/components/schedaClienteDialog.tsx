import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Card, Accordion, AccordionSummary, AccordionDetails, Typography, Button, Box, Grid } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { DataGrid, type GridColDef, type GridRowSelectionModel, type GridRowId } from '@mui/x-data-grid';
import PrintIcon from '@mui/icons-material/Print';
import type { Cliente } from '../storage/clientiDB';
import type { Bolla } from '../storage/bolleDB';
import { getAllBolle } from '../storage/bolleDB';
import { handlePrint, generatePDFBlob } from '../utils/printBolla';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SchedaClienteDialogProps {
  open: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export default function SchedaClienteDialog({
  open,
  onClose,
  cliente
}: SchedaClienteDialogProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [bolleCliente, setBolleCliente] = useState<Bolla[]>([]);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>()
  });

  useEffect(() => {
    if (!cliente) return;
    (async () => {
      const all = await getAllBolle();
      const filtered = all.filter(b =>
        b.destinatarioNome === cliente.ragioneSociale ||
        b.destinatarioNome === cliente.nomeCliente
      );
      setBolleCliente(filtered);
    })();
  }, [cliente]);

  const handlePrintSelected = async () => {
    const selectedIds = Array.from(rowSelectionModel.ids) as number[];
    const selectedBolle = bolleCliente.filter(b => selectedIds.includes(b.id!));

    const zip = new JSZip();

    for (const bolla of selectedBolle) {
      const pdfBlob = await generatePDFBlob(bolla);
      zip.file(`bolla_${bolla.numeroBolla}.pdf`, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `bolle_${cliente?.nomeCliente || 'cliente'}.zip`);
  };

  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOra', headerName: 'Data', width: 150 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    { field: 'indirizzoDestinazione', headerName: 'Dest. consegna', width: 200 },
    {
      field: 'print',
      headerName: 'Stampa',
      width: 100,
      renderCell: params => (
        <Button
          onClick={e => {
            e.stopPropagation();
            handlePrint(params.row as Bolla);
          }}
          startIcon={<PrintIcon />}
          size="small"
          sx={{ color: '#4C57E5 !important' }}
        >
          PDF
        </Button>
      )
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth className="custom-dialog">
      <DialogTitle
        sx={{
          bgcolor: '#fafafa',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <AccountCircleIcon fontSize="large" sx={{ mr: 1 }} />
        Dettaglio Cliente
      </DialogTitle>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        centered
      >
        <Tab label="Anagrafica" />
        <Tab label="Bolle" />
      </Tabs>

      <DialogContent>
        {tabIndex === 0 && cliente && (
          <Box mt={2}>
            <Card variant="outlined" sx={{ p: 2, mb: 2, filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))', borderRadius:'32px' }}>
              <Typography variant="h4" gutterBottom> Anagrafica </Typography>
              <Grid container spacing={2}>
                <Grid size={6} sx={{display: 'flex', flexDirection: 'column'}}>
                  <Typography variant="h5" gutterBottom> Dati cliente </Typography>
                  <Box>
                    <strong>Nome:</strong> {cliente.nomeCliente}
                  </Box>
                  <Box>
                    <strong>Cognome:</strong> {cliente.cognomeCliente}
                  </Box>
                  <Box>
                    <strong>Telefono Fisso:</strong> {cliente.telefonoFisso}
                  </Box>
                  <Box>
                    <strong>Cellulare:</strong> {cliente.telefonoCell}
                  </Box>
                  <Box>
                    <strong>Email:</strong> {cliente.email}
                  </Box>
                  <Box>
                    <strong>P.IVA:</strong> {cliente.partitaIva}
                  </Box>
                  <Box>
                    <strong>Codice SDI:</strong> {cliente.codiceSDI}
                  </Box>
                </Grid>
                <Grid size={6} sx={{display: 'flex', flexDirection: 'column'}}>
                  <Typography variant="h5" gutterBottom> Indirizzo cliente </Typography>
                  <Box sx={{display: 'flex', flexDirection: 'row'}}>
                    <Box>
                      <strong>Via:</strong> {cliente.via}
                    </Box>
                    <Box ml={1}>
                      <strong>n.:</strong> {cliente.numeroCivico}
                    </Box>
                  </Box>
                  <Box>
                    <strong>CAP:</strong> {cliente.cap}
                  </Box>
                  <Box>
                    <strong>Città:</strong> {cliente.paese}
                  </Box>
                  <Box>
                    <strong>Prov.:</strong> {cliente.provincia}
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Box>
        )}

        {tabIndex === 1 && (
          <Accordion defaultExpanded sx={{ boxShadow: ' 0px 4px 10px 0px #00000045', padding: '1em', borderRadius: '32px !important' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography><strong> Totale bolle: </strong> {bolleCliente.length} </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ boxShadow: ' 0' }}>
              <Box mb={2}>
                <Button
                  className='btn'
                  variant="contained"
                  disabled={rowSelectionModel.ids.size === 0}
                  onClick={handlePrintSelected}
                  startIcon={<PrintIcon />}
                >
                  Stampa selezionate ({rowSelectionModel.ids.size})
                </Button>
              </Box>
              <Box sx={{ height: 400, width: '100%', filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))', borderRadius: '32px' }}>
                <DataGrid
                  rows={bolleCliente}
                  columns={columns}
                  getRowId={row => row.id!}
                  checkboxSelection
                  rowSelectionModel={rowSelectionModel}
                  onRowSelectionModelChange={setRowSelectionModel}
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5 } }
                  }}
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
                    '& .MuiDataGrid-row:nth-of-type(odd)': {
                      bgcolor: '#f7f7f7'
                    }
                  }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      <DialogActions>
        <Button className='btn' sx={{marginBottom: '1em', marginRight: '24px'}} onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}