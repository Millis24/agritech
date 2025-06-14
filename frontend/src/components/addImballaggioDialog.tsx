import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, InputAdornment, Box, Stack } from '@mui/material';
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
      reverseButtons: true,
      focusConfirm: false,   // non mettere subito a fuoco il Confirm
      focusCancel: true,     // metti a fuoco prima il Cancel
      allowEnterKey: true,   // abilita Enter per confermare
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus disableAutoFocus>
      <DialogTitle>{imballaggio ? 'Modifica Imballaggio' : 'Nuovo Imballaggio'}</DialogTitle>
      <DialogContent>
        <Stack spacing={4} mt={1}>
          {/* Tipo e prezzo */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' fullWidth label="Tipo" value={formData.tipo} onChange={(e) => handleChange('tipo', e.target.value)} />
            <TextField className='input-tondi' fullWidth type="number" label="Prezzo" value={formData.prezzo} onChange={(e) => handleChange('prezzo', parseFloat(e.target.value))} InputProps={{ startAdornment: ( <InputAdornment position="start"> € </InputAdornment> ), }} />
          </Box>
          {/* Dimensioni e Capacità */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' fullWidth label="Dimensioni" value={formData.dimensioni} onChange={(e) => handleChange('dimensioni', e.target.value)} />
            <TextField className='input-tondi' fullWidth type="number" label="Capacità (Kg)" value={formData.capacitaKg} onChange={(e) => handleChange('capacitaKg', parseFloat(e.target.value))} />
          </Box>
          {/* Note */}
          <TextField className='input-tondi' fullWidth label="Note" value={formData.note} onChange={(e) => handleChange('note', e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" onClick={handleSubmit} className='btn'>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}