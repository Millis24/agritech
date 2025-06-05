import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

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

  const handleSubmit = () => {
    if (prodotto) {
      // MODIFICA
      onSave({ ...prodotto, ...data });
    } else {
      // CREAZIONE
      onSave(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{prodotto ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Nome" value={data.nome} onChange={(e) => handleChange('nome', e.target.value)} fullWidth />
          <TextField label="Varietà" value={data.varieta} onChange={(e) => handleChange('varieta', e.target.value)} fullWidth />
          <TextField label="Calibro" value={data.calibro} onChange={(e) => handleChange('calibro', e.target.value)} fullWidth />
          <TextField label="Colore" value={data.colore} onChange={(e) => handleChange('colore', e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button onClick={handleSubmit} variant="contained">Salva</Button>
      </DialogActions>
    </Dialog>
  );
}