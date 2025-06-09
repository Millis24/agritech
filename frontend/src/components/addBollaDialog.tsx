import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Typography, Grid
} from '@mui/material';
import type { Cliente } from './addClienteDialog';
import type { Prodotto } from './addProdottoDialog';
import type { Imballaggio } from './addImballaggioDialog';
import type { Bolla } from '../storage/bolleDB';

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
    nome: '', indirizzo: '', email: '', telefono: '', partitaIva: '', codiceSDI: ''
  });
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('');
  const [indirizzoDestinazione, setIndirizzoDestinazione] = useState('');
  const [causale, setCausale] = useState('');
  const [dataOra, setDataOra] = useState(() => new Date().toISOString().slice(0, 16));
  const [prodottiBolla, setProdottiBolla] = useState<any[]>([]);
  const [consegnaACarico, setConsegnaACarico] = useState('');
  const [vettore, setVettore] = useState('');

  useEffect(() => {
    if (selectedClienteId !== '') {
      const cliente = clienti.find(c => c.id === selectedClienteId);
      if (cliente) {
        setDestinatario({
          nome: cliente.nomeCliente,
          indirizzo: cliente.ragioneSociale,
          email: cliente.email,
          telefono: cliente.telefono,
          partitaIva: cliente.partitaIva,
          codiceSDI: ''
        });
      }
    }
  }, [selectedClienteId]);

  useEffect(() => {
    if (bolla)  {
      setDestinatario({
        nome: bolla.destinatarioNome,
        indirizzo: bolla.destinatarioIndirizzo,
        email: bolla.destinatarioEmail,
        telefono: bolla.destinatarioTelefono,
        partitaIva: bolla.destinatarioPartitaIva,
        codiceSDI: bolla.destinatarioCodiceSDI
      });
      setDataOra(bolla.dataOra.slice(0, 16));
      setIndirizzoDestinazione(bolla.indirizzoDestinazione);
      setCausale(bolla.causale);
      setConsegnaACarico(bolla.consegnaACarico);
      setVettore(bolla.vettore);
      setSelectedClienteId('');
      try {
        setProdottiBolla(JSON.parse(bolla.prodotti));
      } catch {
        setProdottiBolla([]);
      }
    } else {
      setDestinatario({ nome: '', indirizzo: '', email: '', telefono: '', partitaIva: '', codiceSDI: '' });
      setSelectedClienteId('');
      setIndirizzoDestinazione('');
      setCausale('');
      setDataOra(new Date().toISOString().slice(0, 16));
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

    // Aggiorna automaticamente il prezzo dell'imballaggio selezionato
    if (field === 'nomeImballaggio') {
      const imballaggio = imballaggi.find(i => i.tipo === value);
      if (imballaggio) {
        nuovi[index].prezzoImballaggio = imballaggio.prezzo;
      }
    }

    setProdottiBolla(nuovi);
  };

  const handleSubmit = () => {
    const baseBolla = {
      numeroBolla: bolla?.numeroBolla ?? numeroBolla,
      dataOra: new Date(dataOra).toISOString(),
      destinatarioNome: destinatario.nome,
      destinatarioIndirizzo: destinatario.indirizzo,
      destinatarioEmail: destinatario.email,
      destinatarioTelefono: destinatario.telefono,
      destinatarioPartitaIva: destinatario.partitaIva,
      destinatarioCodiceSDI: destinatario.codiceSDI,
      indirizzoDestinazione,
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

    onSave(nuovaBolla);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{bolla ? 'Modifica Bolla' : 'Nuova Bolla'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              select fullWidth label="Cliente"
              value={selectedClienteId} onChange={(e) => setSelectedClienteId(Number(e.target.value))}
            >
              {clienti.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nomeCliente}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {Object.entries(destinatario).map(([field, val]) => (
            <Grid size={6} key={field}>
              <TextField fullWidth label={field} value={val} onChange={(e) => setDestinatario({ ...destinatario, [field]: e.target.value })} />
            </Grid>
          ))}

          <Grid size={6}>
            <TextField fullWidth label="Data e ora" type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} />
          </Grid>

          <Grid size={6}>
            <TextField fullWidth label="Indirizzo di destinazione" value={indirizzoDestinazione} onChange={(e) => setIndirizzoDestinazione(e.target.value)} />
          </Grid>

          <Grid size={6}>
            <TextField select fullWidth label="Causale di trasporto" value={causale} onChange={(e) => setCausale(e.target.value)}>
              <MenuItem value="Vendita">Vendita</MenuItem>
              <MenuItem value="Conto visione">Conto visione</MenuItem>
              <MenuItem value="Reso">Reso</MenuItem>
            </TextField>
          </Grid>

          <Grid size={6}>
            <TextField select fullWidth label="Consegna a carico del" value={consegnaACarico} onChange={(e) => setConsegnaACarico(e.target.value)}>
              <MenuItem value="Mittente">Mittente</MenuItem>
              <MenuItem value="Destinatario">Destinatario</MenuItem>
            </TextField>
          </Grid>

          <Grid size={6}>
            <TextField select fullWidth label="Vettore" value={vettore} onChange={(e) => setVettore(e.target.value)}>
              <MenuItem value="Corriere A">Corriere A</MenuItem>
              <MenuItem value="Corriere B">Corriere B</MenuItem>
              <MenuItem value="Altro">Altro</MenuItem>
            </TextField>
          </Grid>

          <Grid size={12}>
            <Typography variant="h6">Prodotti</Typography>
            <Button variant="outlined" onClick={handleAddProdotto}>+ Aggiungi Prodotto</Button>
            {prodottiBolla.map((r, i) => (
              <Grid container spacing={1} key={i} sx={{ mt: 1 }}>
                <Grid size={3}>
                  <TextField
                    select fullWidth label="Prodotto"
                    value={r.nomeProdotto}
                    onChange={(e) => handleProdottoChange(i, 'nomeProdotto', e.target.value)}
                  >
                    {prodotti.map(p => (
                      <MenuItem key={p.id} value={p.nome}>{p.nome}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={3}><TextField fullWidth label="Qualità" value={r.qualita} onChange={(e) => handleProdottoChange(i, 'qualita', e.target.value)} /></Grid>
                <Grid size={2}><TextField fullWidth type="number" label="Prezzo" value={r.prezzo} onChange={(e) => handleProdottoChange(i, 'prezzo', +e.target.value)} /></Grid>
                <Grid size={2}>
                  <TextField select fullWidth label="Imballaggio" value={r.nomeImballaggio} onChange={(e) => handleProdottoChange(i, 'nomeImballaggio', e.target.value)}>
                    {imballaggi.map(im => (
                      <MenuItem key={im.id} value={im.tipo}>{im.tipo}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={2}>
                  <TextField
                    fullWidth
                    label="Prezzo Imballaggio"
                    value={r.prezzoImballaggio ?? ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={2}><TextField fullWidth type="number" label="Colli" value={r.numeroColli} onChange={(e) => handleProdottoChange(i, 'numeroColli', +e.target.value)} /></Grid>
                <Grid size={2}><TextField fullWidth type="number" label="Peso lordo" value={r.pesoLordo} onChange={(e) => handleProdottoChange(i, 'pesoLordo', +e.target.value)} /></Grid>
                <Grid size={2}><TextField fullWidth type="number" label="Peso netto" value={r.pesoNetto} onChange={(e) => handleProdottoChange(i, 'pesoNetto', +e.target.value)} /></Grid>
                <Grid size={2}><TextField fullWidth type="number" label="Tot Kg" value={r.totKgSpediti} onChange={(e) => handleProdottoChange(i, 'totKgSpediti', +e.target.value)} /></Grid>
              </Grid>
            ))}
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