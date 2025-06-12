// File: src/components/SchedaClienteDialog.tsx
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box, IconButton
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PrintIcon from '@mui/icons-material/Print';
import type { Cliente } from '../storage/clientiDB';
import type { Bolla } from '../storage/bolleDB';
import { getAllBolle } from '../storage/bolleDB';
import { handlePrint } from '../utils/printBolla';

interface SchedaClienteDialogProps {
  open: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export default function SchedaClienteDialog({ open, onClose, cliente }: SchedaClienteDialogProps) {
  const [bolleCliente, setBolleCliente] = useState<Bolla[]>([]);

  useEffect(() => {
    if (!cliente) return;
    (async () => {
      const all = await getAllBolle();
      const filtered = all.filter(b => b.destinatarioNome === cliente.nomeCliente);
      setBolleCliente(filtered);
    })();
  }, [cliente]);



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
        <IconButton onClick={() => handlePrint(params.row as Bolla)}>
          <PrintIcon />
        </IconButton>
      ),
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Dettaglio Cliente</DialogTitle>
      <DialogContent>
        {cliente && (
          <Box mb={2}>
            <Typography><strong>Nome:</strong> {cliente.nomeCliente}</Typography>
            <Typography><strong>Ragione Sociale:</strong> {cliente.ragioneSociale}</Typography>
            <Typography><strong>Via:</strong> {cliente.via}, <strong>n.</strong> {cliente.numeroCivico}</Typography>
            <Typography><strong>CAP:</strong> {cliente.cap} <strong>Città:</strong> {cliente.paese} <strong>Prov:</strong> {cliente.provincia}</Typography>
            <Typography><strong>Telefono Fisso:</strong> {cliente.telefonoFisso}</Typography>
            <Typography><strong>Cellulare:</strong> {cliente.telefonoCell}</Typography>
            <Typography><strong>Email:</strong> {cliente.email}</Typography>
            <Typography><strong>P.IVA:</strong> {cliente.partitaIva}</Typography>
            <Typography><strong>Codice SDI:</strong> {cliente.codiceSDI}</Typography>
          </Box>
        )}
        <Typography variant="h6" gutterBottom>Liste Bolle</Typography>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={bolleCliente}
            columns={columns}
            getRowId={row => row.id!}
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}
