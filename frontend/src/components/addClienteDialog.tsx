import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Box, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

export interface Cliente {
  id: number;
  nomeCliente: string;
  cognomeCliente: string;
  ragioneSociale: string;
  via: string,
  numeroCivico: string,
  cap: string,
  paese: string,
  provincia: string,
  partitaIva: string;
  codiceSDI: string;
  telefonoFisso: string;
  telefonoCell: string;
  email: string;
  synced?: boolean;
  createdAt?: string;
}

export const imballaggioVuoto = {
  nomeCliente: '',
  cognomeCliente: '',
  ragioneSociale: '',
  via: '',
  numeroCivico: '',
  cap: '',
  paese: '',
  provincia: '',
  partitaIva: '',
  codiceSDI: '',
  telefonoFisso: '',
  telefonoCell: '',
  email: ''
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: Partial<Cliente>) => Promise<Cliente>;
  cliente?: Cliente | null;
};

export default function AddClienteDialog({ open, onClose, onSave, cliente }: Props) {
  const clienteVuoto = { nomeCliente: '', cognomeCliente: '', ragioneSociale: '', partitaIva: '', telefonoFisso: '', telefonoCell: '', email: '', via: '', numeroCivico: '', cap: '', paese: '', provincia: '', codiceSDI: '' };
  const [data, setData] = useState(clienteVuoto);
  const fieldRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (cliente) {
      const { id, createdAt, synced, ...rest } = cliente;
      setData({ ...clienteVuoto, ...rest });
    } else {
      setData(clienteVuoto);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      // focus on the first field (Nome) when dialog opens
      setTimeout(() => {
        fieldRefs.current[0]?.focus();
      }, 0);
    }
  }, [open]);

  const handleChange = (field: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const isEdit = Boolean(cliente);
    const result = await Swal.fire({
      title: isEdit
        ? `Modificare il cliente "${data.nomeCliente}"?`
        : `Creare il cliente "${data.nomeCliente}"?`,
      text: isEdit
        ? 'I dati esistenti verranno aggiornati.'
        : 'Verrà inserito un nuovo cliente nel sistema.',
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

    await onSave(data);

    setData({ ...data });

    await Swal.fire({
      icon: 'success',
      title: isEdit ? 'Cliente modificato!' : 'Cliente creato!',
      showConfirmButton: false,
      timer: 1400
    });

    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleEnterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    // find the containing form element from the current target
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    if (!form) return;
    e.preventDefault();
    // Collect focusable elements in ordering of appearance
    const focusable = Array.from(
      form.querySelectorAll('input, textarea, button, [role="combobox"]')
    ) as HTMLElement[];
    const index = focusable.indexOf(e.target as HTMLElement);
    if (index > -1 && index < focusable.length - 1) {
      focusable[index + 1].focus();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus disableAutoFocus className="custom-dialog">
      <DialogTitle>{cliente ? 'Modifica Cliente' : 'Aggiungi Cliente'}</DialogTitle>
      <DialogContent>
        <form onKeyDownCapture={handleEnterKeyDown}>
          <Stack spacing={1} mt={1}>
            {/* Nome e Cognome */}
            <Typography>Nome e Cognome</Typography>
            <Box display="flex" gap={2}>
              <TextField
                // className='input-tondi'
                label="Nome"
                value={data.nomeCliente}
                onChange={(e) => handleChange('nomeCliente', e.target.value)}
                inputRef={el => fieldRefs.current[0] = el}
                fullWidth
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Cognome"
                value={data.cognomeCliente}
                onChange={(e) => handleChange('cognomeCliente', e.target.value)}
                inputRef={el => fieldRefs.current[1] = el}
                fullWidth
                variant="standard" 
              />
            </Box>
            <Typography sx={{marginTop: '3em !important'}}>Indirizzo</Typography>
            <Box display="flex" gap={2}>
              {/* Indirizzo: Via e Numero */}
              <TextField
                // className='input-tondi'
                label="Via"
                value={data.via}
                onChange={e => handleChange('via', e.target.value)}
                inputRef={el => fieldRefs.current[3] = el}
                fullWidth
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Numero civico"
                value={data.numeroCivico}
                onChange={e => handleChange('numeroCivico', e.target.value)}
                inputRef={el => fieldRefs.current[4] = el}
                fullWidth
                variant="standard" 
              />
            </Box>
            {/* Indirizzo: CAP, Paese e Provincia */}
            <Box display="flex" gap={2}>
              <TextField
                // className='input-tondi'
                label="CAP"
                value={data.cap}
                onChange={e => handleChange('cap', e.target.value)}
                inputRef={el => fieldRefs.current[5] = el}
                fullWidth
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Paese"
                value={data.paese}
                onChange={e => handleChange('paese', e.target.value)}
                inputRef={el => fieldRefs.current[6] = el}
                fullWidth
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Provincia"
                value={data.provincia}
                onChange={e => handleChange('provincia', e.target.value)}
                inputRef={el => fieldRefs.current[7] = el}
                fullWidth
                variant="standard" 
              />          
            </Box>    
            <Typography sx={{marginTop: '3em !important'}}>Dati Aziendali</Typography>
            <Box display="flex" gap={2}>
              {/* Ragione Sociale */}
              <TextField
                // className='input-tondi'
                label="Ragione Sociale"
                value={data.ragioneSociale}
                onChange={(e) => handleChange('ragioneSociale', e.target.value)}
                inputRef={el => fieldRefs.current[2] = el}
                fullWidth
                variant="standard" 
              />
              {/* P.iva e SDI */}
              <TextField
                // className='input-tondi'
                label="Partita IVA"
                value={data.partitaIva}
                onChange={(e) => handleChange('partitaIva', e.target.value)}
                inputRef={el => fieldRefs.current[8] = el}
                fullWidth
                variant="standard"
              />
              <TextField
                // className='input-tondi'
                label="Codice SDI"
                value={data.codiceSDI}
                onChange={e => handleChange('codiceSDI', e.target.value)}
                inputRef={el => fieldRefs.current[9] = el}
                fullWidth
                variant="standard" 
              />
            </Box>
            {/* Recapiti telefonici */}
            <Typography sx={{marginTop: '3em !important'}}>Recapiti</Typography>
            <Box display="flex" gap={2}>
              <TextField
                // className='input-tondi'
                label="Telefono fisso"
                value={data.telefonoFisso}
                onChange={e => handleChange('telefonoFisso', e.target.value)}
                inputRef={el => fieldRefs.current[10] = el}
                fullWidth
                variant="standard" 
              />
              <TextField
                // className='input-tondi'
                label="Cellulare"
                value={data.telefonoCell}
                onChange={e => handleChange('telefonoCell', e.target.value)}
                inputRef={el => fieldRefs.current[11] = el}
                fullWidth
                variant="standard" 
              />
            </Box>    
            {/* Email */}
            <TextField
              // className='input-tondi'
              label="Email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              inputRef={el => fieldRefs.current[12] = el}
              fullWidth
              variant="standard" 
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" onClick={handleSubmit} className='btn'> Salva </Button>
      </DialogActions>
    </Dialog>
  );
}