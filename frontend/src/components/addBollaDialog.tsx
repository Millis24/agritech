import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Typography, Grid,
  InputAdornment
} from '@mui/material';
import type { Cliente } from '../storage/clientiDB';
import type { Prodotto } from './addProdottoDialog';
import type { Imballaggio } from './addImballaggioDialog';
import type { Bolla } from '../storage/bolleDB';
import Swal from 'sweetalert2';

interface BollaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (bolla: Bolla) => void;
  bolla: Bolla | null;
  clienti: Cliente[];
  prodotti: Prodotto[];
  imballaggi: Imballaggio[];
  numeroBolla: number;
}

export default function AddBollaDialog({
  open, onClose, onSave, clienti, prodotti, imballaggi, numeroBolla, bolla 
}: BollaDialogProps) {
  const [destinatario, setDestinatario] = useState({
    nome: '', cognome: '', via: '', numeroCivico: '', email: '', telefonoFisso: '', telefonoCell: '', partitaIva: '', codiceSDI: ''
  });
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('');
  const [indirizzoDestinazione, setIndirizzoDestinazione] = useState('');
  const [causale, setCausale] = useState('');
  const [dataOra, setDataOra] = useState(() => new Date().toISOString().slice(0, 16));
  const [prodottiBolla, setProdottiBolla] = useState<any[]>([]);
  const [consegnaACarico, setConsegnaACarico] = useState('');
  const [vettore, setVettore] = useState('');
  const [destTipo, setDestTipo] = useState<'sede'|'altra'>('sede');

  useEffect(() => {
    if (selectedClienteId !== '') {
      const cliente = clienti.find(c => c.id === selectedClienteId);
      if (cliente) {
        setDestinatario({
          nome: cliente.nomeCliente,
          cognome: cliente.cognomeCliente,
          via: cliente.via,
          numeroCivico: cliente.numeroCivico,
          email: cliente.email,
          telefonoFisso: cliente.telefonoFisso,
          telefonoCell: cliente.telefonoCell,
          partitaIva: cliente.partitaIva,
          codiceSDI: cliente.codiceSDI
        });
      }
    }
  }, [selectedClienteId, clienti]);

useEffect(() => {
  if (bolla) {
    setDestinatario({
      nome: bolla.destinatarioNome,
      cognome: bolla.destinatarioCognome || '',
      via: bolla.destinatarioVia || '',
      numeroCivico: bolla.destinatarioNumeroCivico || '',
      email: bolla.destinatarioEmail,
      telefonoFisso: bolla.destinatarioTelefonoFisso || '',
      telefonoCell: bolla.destinatarioTelefonoCell || '',
      partitaIva: bolla.destinatarioPartitaIva,
      codiceSDI: bolla.destinatarioCodiceSDI
    });
    setDataOra(bolla.dataOra.slice(0, 16));
    setDestTipo('sede');
    setIndirizzoDestinazione(bolla.indirizzoDestinazione);
    setCausale(bolla.causale);
    setConsegnaACarico(bolla.consegnaACarico);
    setVettore(bolla.vettore);
    try {
      setProdottiBolla(JSON.parse(bolla.prodotti));
    } catch {
      setProdottiBolla([]);
    }
  } else {
    // reset
    setDestinatario({
      nome: '',
      cognome: '',
      via: '',
      numeroCivico: '',
      email: '',
      telefonoFisso: '',
      telefonoCell: '',
      partitaIva: '',
      codiceSDI: ''
    });
    setDataOra(new Date().toISOString().slice(0, 16));
    setDestTipo('sede');
    setIndirizzoDestinazione('');
    setCausale('');
    setProdottiBolla([]);
    setConsegnaACarico('');
    setVettore('');
  }
}, [open, bolla]);

  const handleAddProdotto = () => {
    setProdottiBolla([...prodottiBolla, {
      nomeProdotto: '', qualita: '', prezzo: 0, nomeImballaggio: '', prezzoImballaggio: '',
      numeroColli: 0, pesoLordo: 0, pesoNetto: 0, totKgSpediti: 0
    }]);
  };

  const handleProdottoChange = (index: number, field: string, value: any) => {
    const nuovi = [...prodottiBolla];
    nuovi[index][field] = value;

    // aggiorna automaticamente qualità e prezzo del prodotto
    if (field === 'nomeProdotto') {
     const prodottoSelezionato = prodotti.find(p => p.nome === value);
     if (prodottoSelezionato) {
       nuovi[index].qualita = prodottoSelezionato.calibro;
       //nuovi[index].prezzo = prodottoSelezionato.prezzo;
     }
   }

    // aggiorna automaticamente il prezzo dell'imballaggio selezionato
    if (field === 'nomeImballaggio') {
      const imballaggio = imballaggi.find(i => i.tipo === value);
      if (imballaggio) {
        nuovi[index].prezzoImballaggio = imballaggio.prezzo;
      }
    }

    setProdottiBolla(nuovi);
  };

  async function handleSubmit(){
    const destinatarioInd = destTipo==='sede'
      ? `${destinatario.via} ${destinatario.numeroCivico}`
      : indirizzoDestinazione;
    const baseBolla = {
      numeroBolla: bolla?.numeroBolla ?? numeroBolla,
      dataOra: new Date(dataOra).toISOString(),
      destinatarioNome: destinatario.nome,
      destinatarioCognome: destinatario.cognome,
      destinatarioVia:destinatario.via,
      destinatarioNumeroCivico:destinatario.numeroCivico,
      destinatarioEmail: destinatario.email,
      destinatarioTelefonoFisso: destinatario.telefonoFisso,
      destinatarioTelefonoCell: destinatario.telefonoCell,
      destinatarioPartitaIva: destinatario.partitaIva,
      destinatarioCodiceSDI: destinatario.codiceSDI,
      indirizzoDestinazione: destinatarioInd,
      causale,
      prodotti: JSON.stringify(prodottiBolla),
      daTrasportare: JSON.stringify(prodottiBolla.map(p => ({ nomeImballaggio: p.nomeImballaggio, numeroColli: p.numeroColli }))),
      daRendere: JSON.stringify(prodottiBolla.map(p => ({ nomeImballaggio: p.nomeImballaggio, numeroColli: 0 }))),
      consegnaACarico,
      vettore,
      createdAt: new Date().toISOString(),
      synced: false
    };

    // solo se c’è un ID valido
    const nuovaBolla = (bolla && bolla.id !== undefined)
      ? { ...baseBolla, id: bolla.id }
      : baseBolla;
    console.log('🚀 submit bolla', nuovaBolla);

    // chiede conferma all’utente
    const result = await Swal.fire({
      title: bolla
        ? `Salvare le modifiche alla bolla n. ${bolla.numeroBolla}?`
        : `Creare la bolla n. ${numeroBolla}?`,
      text: bolla
        ? 'I dati esistenti verranno sovrascritti.'
        : 'La nuova bolla verrà aggiunta al sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: bolla ? 'Sì, salva' : 'Sì, crea',
      cancelButtonText: 'No, annulla',
      reverseButtons: true,
      focusConfirm: false,   // non mettere subito a fuoco il Confirm
      focusCancel: true,     // metti a fuoco prima il Cancel
      allowEnterKey: true,   // abilita Enter per confermare
    });
    if (!result.isConfirmed) {
      // l'utente ha scelto Annulla
      return;
    }

    onSave(nuovaBolla);
    onClose();

     // notifica di successo
    await Swal.fire({
      title: 'Fatto!',
      text: bolla
        ? `La bolla n. ${bolla.numeroBolla} è stata aggiornata.`
        : `La bolla n. ${nuovaBolla.numeroBolla} è stata creata.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus disableAutoFocus>
      <DialogTitle>{bolla ? 'Modifica Bolla' : 'Nuova Bolla'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          {/* Select Cliente */}
          <Grid size={12}>
            <TextField className='input-tondi' select fullWidth label="Cliente" value={selectedClienteId} onChange={(e) => setSelectedClienteId(Number(e.target.value))} >
              {clienti.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nomeCliente}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {/*  */}
          {Object.entries(destinatario).map(([field, val]) => (
            <Grid size={6} key={field}>
              <TextField className='input-tondi' fullWidth label={field} value={val} onChange={(e) => setDestinatario({ ...destinatario, [field]: e.target.value })} />
            </Grid>
          ))}
          {/* Data e ora */}
          <Grid size={6}>
            <TextField className='input-tondi' fullWidth label="Data e ora" type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} />
          </Grid>
          

          <Grid size={6}>
            <TextField className='input-tondi' select fullWidth label="Indirizzo destinazione" value={destTipo} onChange={e => setDestTipo(e.target.value as 'sede' | 'altra')}>
              <MenuItem value="sede">Sede azienda destinataria</MenuItem>
              <MenuItem value="altra">Altra sede</MenuItem>
            </TextField>          
          </Grid>
          {destTipo === 'altra' ? (
            <Grid size={6}>
              <TextField
                className='input-tondi'
                fullWidth
                label="Inserisci indirizzo"
                value={indirizzoDestinazione}
                onChange={e => setIndirizzoDestinazione(e.target.value)}
              />
            </Grid>
          ) : (
             <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Sede destinataria"
                  value={`${destinatario.via} ${destinatario.numeroCivico}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
          )}
          <Grid size={6}>
            <TextField className='input-tondi' select fullWidth label="Causale di trasporto" value={causale} onChange={(e) => setCausale(e.target.value)}>
              <MenuItem value="Vendita">Vendita</MenuItem>
              <MenuItem value="Conto visione">Conto visione</MenuItem>
              <MenuItem value="Reso">Reso</MenuItem>
            </TextField>
          </Grid>

          <Grid size={6}>
            <TextField className='input-tondi' select fullWidth label="Consegna a carico del" value={consegnaACarico} onChange={(e) => setConsegnaACarico(e.target.value)}>
              <MenuItem value="Destinatario">Destinatario</MenuItem>
              <MenuItem value="Mittente">Mittente</MenuItem>
            </TextField>
          </Grid>

          <Grid size={6}>
            <TextField className='input-tondi' select fullWidth label="Vettore" value={vettore} onChange={(e) => setVettore(e.target.value)}>
              <MenuItem value="Corriere A">Corriere A</MenuItem>
              <MenuItem value="Corriere B">Corriere B</MenuItem>
              <MenuItem value="Altro">Altro</MenuItem>
            </TextField>
          </Grid>

          <Grid size={12}>
            <Typography variant="h6">Prodotti</Typography>
            <Button variant="outlined" onClick={handleAddProdotto} className='btn-neg'>+ Aggiungi Prodotto</Button>
            {prodottiBolla.map((r, i) => (
              <Grid container spacing={4} key={i} sx={{ mt: 2 }}>
                <Grid size={3}>
                  <TextField
                    className='input-tondi'
                    select fullWidth label="Prodotto"
                    value={r.nomeProdotto}
                    onChange={(e) => handleProdottoChange(i, 'nomeProdotto', e.target.value)}
                  >
                    {prodotti.map(p => (
                      <MenuItem key={p.id} value={p.nome}>{p.nome}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={3}><TextField className='input-tondi' fullWidth label="Qualità" value={r.qualita} onChange={(e) => handleProdottoChange(i, 'qualita', e.target.value)} /></Grid>
                <Grid size={2}>
                    <TextField className='input-tondi' fullWidth type="number" label="Prezzo" value={r.prezzo} onChange={(e) => handleProdottoChange(i, 'prezzo', +e.target.value)} InputProps={{ startAdornment: ( <InputAdornment position="start">€</InputAdornment> ), }} />                    
                  </Grid>
                <Grid size={2}>
                  <TextField className='input-tondi' select fullWidth label="Imballaggio" value={r.nomeImballaggio} onChange={(e) => handleProdottoChange(i, 'nomeImballaggio', e.target.value)}>
                    {imballaggi.map(im => (
                      <MenuItem key={im.id} value={im.tipo}>{im.tipo}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={2}>
                  <TextField className='input-tondi' fullWidth type="number" label="Prezzo Imballaggio" value={r.prezzoImballaggio ?? ''} InputProps={{ readOnly: true, startAdornment: ( <InputAdornment position="start">€</InputAdornment> ), }} />
                </Grid>
                <Grid size={2}><TextField className='input-tondi' fullWidth type="number" label="Colli" value={r.numeroColli} onChange={(e) => handleProdottoChange(i, 'numeroColli', +e.target.value)} /></Grid>
                <Grid size={2}><TextField className='input-tondi' fullWidth type="number" label="Peso lordo" value={r.pesoLordo} onChange={(e) => handleProdottoChange(i, 'pesoLordo', +e.target.value)} /></Grid>
                <Grid size={2}><TextField className='input-tondi' fullWidth type="number" label="Peso netto" value={r.pesoNetto} onChange={(e) => handleProdottoChange(i, 'pesoNetto', +e.target.value)} /></Grid>
                <Grid size={2}><TextField className='input-tondi' fullWidth type="number" label="Tot Kg" value={r.totKgSpediti} onChange={(e) => handleProdottoChange(i, 'totKgSpediti', +e.target.value)} /></Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" onClick={handleSubmit} className='btn'>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}