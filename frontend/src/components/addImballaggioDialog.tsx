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

export interface Imballaggio {
  id: number;
  tipo: string;
  dimensioni: string;
  capacitaKg: number;
  note: string;
  synced?: boolean;
  createdAt?: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (imballaggio: Partial<Imballaggio>) => void;
  imballaggio?: Imballaggio | null;
};

export default function AddImballaggioDialog({ open, onClose, onSave, imballaggio }: Props) {
  const imballaggioVuoto = {
    tipo: '',
    dimensioni: '',
    capacitaKg: 0,
    note: ''
  };

  const [data, setData] = useState(imballaggioVuoto);

  useEffect(() => {
    if (imballaggio) {
      const { id, createdAt, synced, ...rest } = imballaggio;
      setData(rest);
    } else {
      setData(imballaggioVuoto);
    }
  }, [imballaggio, open]);

  const handleChange = (field: keyof typeof data, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (imballaggio) {
      // MODIFICA
      onSave({ ...imballaggio, ...data });
    } else {
      // CREAZIONE
      onSave(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{imballaggio ? 'Modifica Imballaggio' : 'Aggiungi Imballaggio'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Tipo"
            value={data.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            fullWidth
          />
          <TextField
            label="Dimensioni"
            value={data.dimensioni}
            onChange={(e) => handleChange('dimensioni', e.target.value)}
            fullWidth
          />
          <TextField
            label="Capacità (Kg)"
            type="number"
            value={data.capacitaKg}
            onChange={(e) => handleChange('capacitaKg', parseFloat(e.target.value))}
            fullWidth
          />
          <TextField
            label="Note"
            value={data.note}
            onChange={(e) => handleChange('note', e.target.value)}
            fullWidth
            multiline
            rows={2}
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