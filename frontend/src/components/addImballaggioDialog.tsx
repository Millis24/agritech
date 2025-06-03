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

export type Imballaggio = {
  id: number;
  tipo: string;
  dimensioni: string;
  capacitàKg: number;
  note?: string;
  synced?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (imballaggio: Imballaggio) => void;
  imballaggio?: Imballaggio | null;
};

export default function AddImballaggioDialog({ open, onClose, onSave, imballaggio }: Props) {
  const [data, setData] = useState<Omit<Imballaggio, 'id'>>({
    tipo: '',
    dimensioni: '',
    capacitàKg: 0,
    note: ''
  });

  useEffect(() => {
    if (imballaggio) {
      const { id, ...rest } = imballaggio;
      setData(rest);
    } else {
      setData({ tipo: '', dimensioni: '', capacitàKg: 0, note: '' });
    }
  }, [imballaggio]);

  const handleChange = (field: keyof typeof data, value: string | number) => {
    setData({ ...data, [field]: value });
  };

  const handleSubmit = () => {
    onSave({ ...data, id: imballaggio?.id ?? Date.now() });
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
            value={data.capacitàKg}
            onChange={(e) => handleChange('capacitàKg', parseFloat(e.target.value))}
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