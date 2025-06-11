import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid } from '@mui/material';
import Swal from 'sweetalert2';

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
  }, [open, imballaggio]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

 const handleSubmit = async () => {
    // 1) Prepara l'oggetto da salvare
    const nuovo: any = {
      ...formData,
      prezzo: Number(formData.prezzo),
      capacitaKg: Number(formData.capacitaKg),
      note: formData.note ?? ''
    };
    if (imballaggio?.id) {
      nuovo.id = imballaggio.id;
    }

    const isEdit = Boolean(imballaggio?.id);
    // 2) Finestra di conferma
    const result = await Swal.fire({
      title: isEdit
        ? `Modificare l’imballaggio "${formData.tipo}"?`
        : `Creare l’imballaggio "${formData.tipo}"?`,
      text: isEdit
        ? 'I dati esistenti verranno aggiornati.'
        : 'Verrà aggiunto un nuovo imballaggio.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Sì, modifica' : 'Sì, crea',
      cancelButtonText: 'No, annulla',
      reverseButtons: true
    });
    if (!result.isConfirmed) {
      return; // annulla il submit
    }

    // 3) Salva e chiudi il dialog
    onSave(nuovo);
    onClose();

    // 4) Toast di conferma successo
    await Swal.fire({
      icon: 'success',
      title: isEdit
        ? 'Imballaggio modificato!'
        : 'Imballaggio creato!',
      showConfirmButton: false,
      timer: 1400
    });
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