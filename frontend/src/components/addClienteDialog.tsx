import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import { useState, useEffect } from 'react';

export interface Cliente {
  id: number;
  nomeCliente: string;
  ragioneSociale: string;
  indirizzo: string;
  partitaIva: string;
  codiceSDI: string;
  telefono: string;
  email: string;
  synced?: boolean;
  createdAt?: string;
}

export const imballaggioVuoto = {
  nomeCliente: '',
  ragioneSociale: '',
  indirizzo: '',
  partitaIva: '',
  codiceSDI: '',
  telefono: '',
  email: ''
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: Partial<Cliente>) => void;
  cliente?: Cliente | null;
};

export default function AddClienteDialog({ open, onClose, onSave, cliente }: Props) {
  const clienteVuoto = { nomeCliente: '', ragioneSociale: '', partitaIva: '', telefono: '', email: '', indirizzo: '', codiceSDI: ''};
  const [data, setData] = useState(clienteVuoto);

  useEffect(() => {
    if (cliente) {
      const { id, createdAt, synced, ...rest } = cliente;
      setData({
        ...clienteVuoto,
        ...rest
      });
    } else {
      setData(clienteVuoto);
    }
  }, [cliente, open]);

  const handleChange = (field: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (cliente) {
      // MODIFICA
      onSave({ ...cliente, ...data });
    } else {
      // CREAZIONE
      onSave(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{cliente ? 'Modifica Cliente' : 'Aggiungi Cliente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Nome" value={data.nomeCliente} onChange={(e) => handleChange('nomeCliente', e.target.value)} fullWidth />
          <TextField label="Ragione Sociale" value={data.ragioneSociale} onChange={(e) => handleChange('ragioneSociale', e.target.value)} fullWidth />
            <TextField label="Indirizzo" value={data.indirizzo} onChange={e => handleChange('indirizzo', e.target.value)} fullWidth/>
          <TextField label="Partita IVA" value={data.partitaIva} onChange={(e) => handleChange('partitaIva', e.target.value)} fullWidth />
            <TextField label="Codice SDI" value={data.codiceSDI} onChange={e => handleChange('codiceSDI', e.target.value)} fullWidth/>
          <TextField label="Telefono" value={data.telefono} onChange={(e) => handleChange('telefono', e.target.value)} fullWidth />
          <TextField label="Email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button variant="contained" onClick={handleSubmit}> Salva </Button>
      </DialogActions>
    </Dialog>
  );
}