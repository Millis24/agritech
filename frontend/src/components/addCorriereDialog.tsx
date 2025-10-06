import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Box } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';

export interface Corriere {
  id: number;
  nome: string;
  email?: string | null;
  createdAt?: string;
}

export const corriereVuoto = {
  nome: '',
  email: ''
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (corriere: Partial<Corriere>) => void;
  corriere?: Corriere | null;
};

export default function AddCorriereDialog({ open, onClose, onSave, corriere }: Props) {
  const [data, setData] = useState(corriereVuoto);
  const fieldRefs = useRef<Array<HTMLElement | null>>([]);

  const handleEnterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    if (!form) return;
    e.preventDefault();
    const focusable = Array.from(
      form.querySelectorAll<HTMLElement>('input, textarea, button')
    );
    const index = focusable.indexOf(e.target as HTMLElement);
    if (index > -1 && index < focusable.length - 1) {
      focusable[index + 1].focus();
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => { fieldRefs.current[0]?.focus(); }, 0);
    }
  }, [open]);

  useEffect(() => {
    if (corriere) {
      const { id, createdAt, ...rest } = corriere;
      setData({
        ...corriereVuoto,
        ...rest,
        email: rest.email || ''
      });
    } else {
      setData(corriereVuoto);
    }
  }, [corriere, open]);

  const handleChange = (field: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const isEdit = Boolean(corriere);
    const result = await Swal.fire({
      title: isEdit
        ? `Modificare il corriere "${data.nome}"?`
        : `Creare il corriere "${data.nome}"?`,
      text: isEdit
        ? 'I dati esistenti verranno aggiornati.'
        : 'Verrà inserito un nuovo corriere nel sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Sì, modifica' : 'Sì, crea',
      cancelButtonText: 'No, annulla',
      reverseButtons: true,
      focusConfirm: false,
      focusCancel: true,
      allowEnterKey: true,
    });
    if (!result.isConfirmed) return;

    if (corriere) {
      onSave({ ...corriere, ...data, email: data.email.trim() || null });
    } else {
      onSave({ ...data, email: data.email.trim() || null });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {corriere ? 'Modifica Corriere' : 'Nuovo Corriere'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <TextField
              inputRef={(el) => (fieldRefs.current[0] = el)}
              variant="standard"
              margin="dense"
              label="Nome Corriere"
              fullWidth
              required
              value={data.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              onKeyDown={handleEnterKeyDown}
            />
            <TextField
              inputRef={(el) => (fieldRefs.current[1] = el)}
              variant="standard"
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onKeyDown={handleEnterKeyDown}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} className='btn-neg'>
          Annulla
        </Button>
        <Button onClick={handleSubmit} variant="contained" className='btn'>
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}
