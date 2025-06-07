import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid } from '@mui/material';

interface AddImballaggioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (imballaggio: {
    id?: number;
    tipo: string;
    prezzo: number;
    dimensioni: string;
    capacitaKg: number;
    note?: string;
    synced?: boolean;
    createdAt?: string;
  }) => void;
  imballaggio: {
    id?: number;
    tipo: string;
    prezzo: number;
    dimensioni: string;
    capacitaKg: number;
    note?: string;
    synced?: boolean;
    createdAt?: string;
  } | null;
}

export interface Imballaggio {
  id?: number;
  tipo: string;
  prezzo: number;
  dimensioni: string;
  capacitaKg: number;
  note?: string;
  synced?: boolean;
  createdAt?: string;
}


export default function AddImballaggioDialog({
  open, onClose, onSave, imballaggio
}: AddImballaggioDialogProps) {
  const [formData, setFormData] = useState({
    tipo: '',
    prezzo: 0,
    dimensioni: '',
    capacitaKg: 0,
    note: ''
  });

  useEffect(() => {
    if (imballaggio) {
      setFormData({
        tipo: imballaggio.tipo,
        prezzo: imballaggio.prezzo,
        dimensioni: imballaggio.dimensioni,
        capacitaKg: imballaggio.capacitaKg,
        note: imballaggio.note ?? ''
      });
    } else {
      setFormData({
        tipo: '',
        prezzo: 0,
        dimensioni: '',
        capacitaKg: 0,
        note: ''
      });
    }
  }, [imballaggio]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    const nuovo: any = {
      ...formData,
      prezzo: Number(formData.prezzo),
      capacitaKg: Number(formData.capacitaKg),
      note: formData.note ?? ''
    };
    if (imballaggio?.id) {
      nuovo.id = imballaggio.id;
    }
    onSave(nuovo);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{imballaggio ? 'Modifica Imballaggio' : 'Nuovo Imballaggio'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={12}>
            <TextField fullWidth label="Tipo" value={formData.tipo} onChange={(e) => handleChange('tipo', e.target.value)} />
          </Grid>
          <Grid size={6}>
            <TextField fullWidth type="number" label="Prezzo" value={formData.prezzo} onChange={(e) => handleChange('prezzo', parseFloat(e.target.value))} />
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label="Dimensioni" value={formData.dimensioni} onChange={(e) => handleChange('dimensioni', e.target.value)} />
          </Grid>
          <Grid size={6}>
            <TextField fullWidth type="number" label="Capacità (Kg)" value={formData.capacitaKg} onChange={(e) => handleChange('capacitaKg', parseFloat(e.target.value))} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label="Note" value={formData.note} onChange={(e) => handleChange('note', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button variant="contained" onClick={handleSubmit}>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}