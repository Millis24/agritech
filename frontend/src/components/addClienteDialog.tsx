import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack
} from '@mui/material';
import { useState, useEffect } from 'react';

export type Cliente = {
  id: number;
  nomeCliente: string;
  ragioneSociale: string;
  partitaIva: string;
  telefono: string;
  email: string;
  synced?: boolean; // per sapere se il dato viene sincronizzato
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: Cliente) => void;
  cliente?: Cliente | null;
};

export default function AddClienteDialog({ open, onClose, onSave, cliente }: Props) {
  const [clienteData, setClienteData] = useState<Omit<Cliente, 'id'>>({
    nomeCliente: '',
    ragioneSociale: '',
    partitaIva: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    if (cliente) {
      const { id, ...rest } = cliente;
      setClienteData(rest);
    } else {
      setClienteData({
        nomeCliente: '',
        ragioneSociale: '',
        partitaIva: '',
        telefono: '',
        email: ''
      });
    }
  }, [cliente]);

  const handleChange = (field: keyof typeof clienteData, value: string) => {
    setClienteData({ ...clienteData, [field]: value });
  };

  const handleSubmit = () => {
    const clienteFinale: Cliente = {
      ...clienteData,
      id: cliente?.id ?? Date.now()
    };

    onSave(clienteFinale);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{cliente ? 'Modifica Cliente' : 'Aggiungi Cliente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nome"
            value={clienteData.nomeCliente}
            onChange={(e) => handleChange('nomeCliente', e.target.value)}
            fullWidth
          />
          <TextField
            label="Ragione Sociale"
            value={clienteData.ragioneSociale}
            onChange={(e) => handleChange('ragioneSociale', e.target.value)}
            fullWidth
          />
          <TextField
            label="Partita IVA"
            value={clienteData.partitaIva}
            onChange={(e) => handleChange('partitaIva', e.target.value)}
            fullWidth
          />
          <TextField
            label="Telefono"
            value={clienteData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={clienteData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button onClick={handleSubmit} variant="contained">
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}