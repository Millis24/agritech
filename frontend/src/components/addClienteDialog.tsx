import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Box } from '@mui/material';
import { useState, useEffect } from 'react';
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
  onSave: (cliente: Partial<Cliente>) => void;
  cliente?: Cliente | null;
};

export default function AddClienteDialog({ open, onClose, onSave, cliente }: Props) {
  const clienteVuoto = { nomeCliente: '', cognomeCliente: '', ragioneSociale: '', partitaIva: '', telefonoFisso: '', telefonoCell: '', email: '',  via: '', numeroCivico: '', cap: '', paese: '', provincia: '', codiceSDI: ''};
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

  const handleSubmit = async () => {
    // 1) chiedi conferma
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
      focusConfirm: false,   // non mettere subito a fuoco il Confirm
      focusCancel: true,     // metti a fuoco prima il Cancel
      allowEnterKey: true,   // abilita Enter per confermare
    });
    if (!result.isConfirmed) {
      return; // l'utente ha annullato
    }

    // 2) esegui POST o PUT
    if (cliente) {
      onSave({ ...cliente, ...data });
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
      <DialogTitle>{cliente ? 'Modifica Cliente' : 'Aggiungi Cliente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={4} mt={1}>
          {/* Nome e Cognome */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' label="Nome" value={data.nomeCliente} onChange={(e) => handleChange('nomeCliente', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Cognome" value={data.cognomeCliente} onChange={(e) => handleChange('cognomeCliente', e.target.value)} fullWidth />
          </Box>
          {/* Ragione Sociale */}
          <TextField className='input-tondi' label="Ragione Sociale" value={data.ragioneSociale} onChange={(e) => handleChange('ragioneSociale', e.target.value)} fullWidth />
          {/* Indirizzo: Via e Numero */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' label="Via" value={data.via} onChange={e => handleChange('via', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Numero civico" value={data.numeroCivico} onChange={e => handleChange('numeroCivico', e.target.value)} fullWidth />
          </Box>
          {/* Indirizzo: CAP, Paese e Provincia */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' label="CAP" value={data.cap} onChange={e => handleChange('cap', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Paese" value={data.paese} onChange={e => handleChange('paese', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Provincia" value={data.provincia} onChange={e => handleChange('provincia', e.target.value)} fullWidth />          
          </Box>    
          {/* P.iva e SDI */}
          <Box display="flex" gap={2}>
            <TextField className='input-tondi' label="Partita IVA" value={data.partitaIva} onChange={(e) => handleChange('partitaIva', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Codice SDI" value={data.codiceSDI} onChange={e => handleChange('codiceSDI', e.target.value)} fullWidth/>
          </Box>
          {/* Recapiti telefonici */}
           <Box display="flex" gap={2}>
            <TextField className='input-tondi' label="Telefono fisso" value={data.telefonoFisso} onChange={e => handleChange('telefonoFisso', e.target.value)} fullWidth />
            <TextField className='input-tondi' label="Cellulare" value={data.telefonoCell} onChange={e => handleChange('telefonoCell', e.target.value)} fullWidth />
          </Box>    
           {/* Email */}
          <TextField className='input-tondi' label="Email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" onClick={handleSubmit} className='btn'> Salva </Button>
      </DialogActions>
    </Dialog>
  );
}