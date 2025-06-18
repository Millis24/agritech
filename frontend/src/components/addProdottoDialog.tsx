import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Box, Typography } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';

export interface Prodotto {
  id: number;
  nome: string;
  varieta: string;
  calibro: string;
  colore: string;
  synced?: boolean;
  createdAt?: string;
}

export const prodottoVuoto = {
  nome: '',
  varieta: '',
  calibro: '',
  colore: ''
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (prodotto: Partial<Prodotto>) => void;
  prodotto?: Prodotto | null;
};

export default function AddProdottoDialog({ open, onClose, onSave, prodotto }: Props) {
  const iniziale = { nome: '', varieta: '', calibro: '', colore: '' };
  const [data, setData] = useState(iniziale);

  // refs for form fields
  const fieldRefs = useRef<Array<HTMLElement | null>>([]);

  // handle Enter to move focus to next field
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

  // focus first field on dialog open
  useEffect(() => {
    if (open) {
      setTimeout(() => { fieldRefs.current[0]?.focus(); }, 0);
    }
  }, [open]);

  useEffect(() => {
    if (prodotto) {
      const { id, createdAt, synced, ...rest } = prodotto;
      setData({
        ...prodottoVuoto,
        ...rest
      });
    } else {
      setData(prodottoVuoto);
    }
  }, [prodotto, open]);

  const handleChange = (field: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // 1) chiedi conferma
    const isEdit = Boolean(prodotto);
    const result = await Swal.fire({
      title: isEdit
        ? `Modificare il prodotto "${data.nome}"?`
        : `Creare il prodotto "${data.nome}"?`,
      text: isEdit
        ? 'I dati esistenti verranno aggiornati.'
        : 'Verrà inserito un nuovo prodotto nel sistema.',
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
      return; // l'utente ha annullato
    }

    // 2) esegui POST o PUT
    if (prodotto) {
      onSave({ ...prodotto, ...data });
    } else {
      onSave(data);
    }
    onClose();

    // 3) toast di successo
    await Swal.fire({
      icon: 'success',
      title: isEdit
        ? 'Cliente modificato!'
        : 'Cliente creato!',
      showConfirmButton: false,
      timer: 1400
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus disableAutoFocus className="custom-dialog">
      <DialogTitle>{prodotto ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}</DialogTitle>
      <DialogContent>
        <form onKeyDownCapture={handleEnterKeyDown}>
          <Stack spacing={1} mt={1}>
            {/* Nome e Varietà */}
            <Typography>Nome e varietà</Typography>
            <Box display="flex" gap={2}>
              <TextField
                // className='input-tondi'
                label="Nome"
                value={data.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                fullWidth
                inputRef={el => fieldRefs.current[0] = el}
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Varietà"
                value={data.varieta}
                onChange={(e) => handleChange('varieta', e.target.value)}
                fullWidth
                inputRef={el => fieldRefs.current[1] = el}
                variant="standard" 
              />
            </Box>
            {/* Calibro e Colore */}
            <Typography sx={{marginTop: '3em !important'}}>Calibro e Colore</Typography>
            <Box display="flex" gap={2}>
              <TextField
                // className='input-tondi'
                label="Calibro"
                value={data.calibro}
                onChange={(e) => handleChange('calibro', e.target.value)}
                fullWidth
                inputRef={el => fieldRefs.current[2] = el}
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Colore"
                value={data.colore}
                onChange={(e) => handleChange('colore', e.target.value)}
                fullWidth
                inputRef={el => fieldRefs.current[3] = el}
                variant="standard" 
              />
            </Box>
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" onClick={handleSubmit} variant="contained" className='btn'>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}