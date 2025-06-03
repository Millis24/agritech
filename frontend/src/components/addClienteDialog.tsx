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
  synced?: boolean;
  createdAt?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: Partial<Cliente>) => void;
  cliente?: Cliente | null;
};

export default function AddClienteDialog({ open, onClose, onSave, cliente }: Props) {
  const clienteVuoto = {
    nomeCliente: '',
    ragioneSociale: '',
    partitaIva: '',
    telefono: '',
    email: ''
  };

  const [clienteData, setClienteData] = useState(clienteVuoto);

  useEffect(() => {
    if (cliente) {
      // Solo i campi che devono essere modificati
      const { id, createdAt, synced, ...rest } = cliente;
      setClienteData(rest);
    } else {
      setClienteData(clienteVuoto);
    }
  }, [cliente, open]);

  const handleChange = (field: keyof typeof clienteData, value: string) => {
    setClienteData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (cliente) {
      // MODIFICA
      onSave({ ...cliente, ...clienteData });
    } else {
      // CREAZIONE
      onSave(clienteData);
    }
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