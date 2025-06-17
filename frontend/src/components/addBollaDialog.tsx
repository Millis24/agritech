import { useEffect, useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Grid,
  InputAdornment, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Cliente } from '../storage/clientiDB';
import type { Prodotto } from './addProdottoDialog';
import type { Imballaggio } from './addImballaggioDialog';
import type { Bolla } from '../storage/bolleDB';
import Swal from 'sweetalert2';
import { Autocomplete, Table, TableContainer, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

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
  const [prodottiBolla, setProdottiBolla] = useState<any[]>([{
    nomeProdotto: '',
    qualita: '',
    prezzo: 0,
    nomeImballaggio: '',
    prezzoImballaggio: '',
    numeroColli: 0,
    pesoLordo: 0,
    pesoNetto: 0,
    totKgSpediti: 0,
  }]);
  const [consegnaACarico, setConsegnaACarico] = useState('');
  const [vettore, setVettore] = useState('');
  const [destTipo, setDestTipo] = useState<'sede'|'altra'>('sede');

  const selectedClienteObj = clienti.find(c => c.id === selectedClienteId);

  const prezzoRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ref for causale input
  const causaleRef = useRef<HTMLInputElement | null>(null);

  // autocompletamenti causale open/close
  const [openCausale, setOpenCausale] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  const [openImballaggioIndex, setOpenImballaggioIndex] = useState<number | null>(null);

  // Move focus to next input on Enter, including combobox elements (for Autocomplete)
  const handleEnterKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget;
      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input, textarea, select, button, [role="combobox"]'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.tabIndex >= 0);
      const index = focusable.indexOf(e.target as HTMLElement);
      const next = focusable[index + 1] || focusable[0];
      next.focus();
    }
  };

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
    // restore selected cliente by matching name
    if (bolla.destinatarioNome) {
      const cli = clienti.find(c => c.nomeCliente === bolla.destinatarioNome);
      if (cli) {
        setSelectedClienteId(cli.id);
        setDestinatario({
          nome: cli.nomeCliente,
          cognome: cli.cognomeCliente || '',
          via: cli.via,
          numeroCivico: cli.numeroCivico,
          email: cli.email,
          telefonoFisso: cli.telefonoFisso,
          telefonoCell: cli.telefonoCell,
          partitaIva: cli.partitaIva,
          codiceSDI: cli.codiceSDI
        });
      }
    }
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
    setSelectedClienteId('');
    setDataOra(new Date().toISOString().slice(0, 16));
    setDestTipo('sede');
    setIndirizzoDestinazione('');
    setCausale('');
    setProdottiBolla([{
      nomeProdotto: '',
      qualita: '',
      prezzo: 0,
      nomeImballaggio: '',
      prezzoImballaggio: '',
      numeroColli: 0,
      pesoLordo: 0,
      pesoNetto: 0,
      totKgSpediti: 0,
    }]);
    setConsegnaACarico('');
    setVettore('');
  }
}, [open, bolla]);

  useEffect(() => {
    if (open) {
      // focus on causale field when dialog opens
      setTimeout(() => { causaleRef.current?.focus(); }, 0);
    }
  }, [open]);

  const handleAddProdotto = () => {
    setProdottiBolla([...prodottiBolla, {
      nomeProdotto: '', qualita: '', prezzo: 0, nomeImballaggio: '', prezzoImballaggio: '',
      numeroColli: 0, pesoLordo: 0, pesoNetto: 0, totKgSpediti: 0
    }]);
  };

  const handleProdottoChange = (index: number, field: string, value: any) => {
    const nuovi = [...prodottiBolla];
    nuovi[index][field] = value;

    // aggiorna automaticamente qualità
    if (field === 'nomeProdotto') {
      const prodottoSelezionato = prodotti.find(p => p.nome === value);
      if (prodottoSelezionato) {
        nuovi[index].qualita = prodottoSelezionato.calibro;
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

  const handleRemoveProdotto = (index: number) => {
    const nuovi = [...prodottiBolla];
    nuovi.splice(index, 1);
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
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth disableEnforceFocus disableAutoFocus className="custom-dialog">
      <DialogTitle>{bolla ? 'Modifica Bolla' : 'Nuova Bolla'}</DialogTitle>
      <DialogContent>
        <form onKeyDown={handleEnterKeyDown} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Grid container spacing={4}>
          <Grid size={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold'}} >Dati Bolla</Typography>
            <Grid container spacing={2}>
              {/* Causale */}
              <Grid size={8}>
                <Autocomplete
                  open={openCausale}
                  onOpen={() => setOpenCausale(true)}
                  onClose={() => setOpenCausale(false)}
                  autoHighlight
                  options={['Vendita', 'Conto visione', 'Reso']}
                  value={causale}
                  onChange={(_, v) => setCausale(v || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !openCausale) {
                      e.preventDefault();
                      handleEnterKeyDown(e);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputRef={(el: HTMLInputElement | null) => { causaleRef.current = el; }}
                      fullWidth
                      variant="standard"
                      label="Causale di trasporto"
                    />
                  )}
                />
              </Grid>
              {/* Numero Bolla */}
              <Grid size={4}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="N. DDT"
                  value={bolla ? bolla.numeroBolla : numeroBolla}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {/* Data e ora */}
              <Grid size={12}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Data e ora"
                  type="datetime-local"
                  value={dataOra}
                  onChange={(e) => setDataOra(e.target.value)}
                />
              </Grid>
              {/* Cliente */}
              <Grid size={12}>
                <Autocomplete
                  options={clienti}
                  getOptionLabel={(option) => `${option.id} - ${option.nomeCliente}`}
                  value={clienti.find(c => c.id === selectedClienteId) || null}
                  onChange={(_, newValue) => setSelectedClienteId(newValue ? newValue.id : '')}
                  open={openCliente}
                  onOpen={() => setOpenCliente(true)}
                  onClose={() => setOpenCliente(false)}
                  autoHighlight
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !openCliente) {
                      e.preventDefault();
                      handleEnterKeyDown(e);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="standard" label="Cliente" />
                  )}
                />
              </Grid>
              {/* Consegna a carico */}
              <Grid size={12}>
                <Autocomplete
                  size="small"
                  options={[ 'Destinatario', 'Mittente' ]}
                  getOptionLabel={opt => opt}
                  value={consegnaACarico}
                  onChange={(_, v) => setConsegnaACarico(v || '')}
                  autoHighlight
                  renderInput={params => (
                    <TextField
                      {...params}
                      size="small"
                      margin="dense"
                      fullWidth
                      variant="standard"
                      label="Consegna a carico"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEnterKeyDown(e);
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              {/* Vettore */}
              <Grid size={12}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={[ 'Corriere 1', 'Corriere 2', 'Altro' ]}
                  value={vettore}
                  onChange={(_, newValue) => setVettore(newValue || '')}
                  onInputChange={(_, newInput) => setVettore(newInput)}
                  autoHighlight
                  renderInput={params => (
                    <TextField
                      {...params}
                      size="small"
                      margin="dense"
                      fullWidth
                      variant="standard"
                      label="Vettore"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold'}} >Info Cliente</Typography>
            <Grid container spacing={2}>
              {/* Nome */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Nome"
                  value={destinatario.nome}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Cognome */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Cognome"
                  value={destinatario.cognome}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Ragione Sociale */}
              <Grid size={12}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Ragione Sociale"
                  value={selectedClienteObj?.ragioneSociale || selectedClienteObj?.nomeCliente || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Via */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Via"
                  value={destinatario.via}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Numero civico */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Numero"
                  value={destinatario.numeroCivico}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* CAP */}
              <Grid size={4}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="CAP"
                  value={selectedClienteObj?.cap || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Paese */}
              <Grid size={4}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Paese"
                  value={selectedClienteObj?.paese || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Provincia */}
              <Grid size={4}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Provincia"
                  value={selectedClienteObj?.provincia || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Partita IVA */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Partita IVA"
                  value={selectedClienteObj?.partitaIva || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
              {/* Telefono */}
              <Grid size={6}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Telefono"
                  value={selectedClienteObj?.telefonoCell || selectedClienteObj?.telefonoFisso || ''}
                  variant="filled"
                  InputProps={{ readOnly: true, disableUnderline: true }}
                  inputProps={{ tabIndex: -1 }}
                />
              </Grid>
               
              </Grid>
              
          </Grid>
        </Grid>
        {/* --- FINE BLOCCO DATI CLIENTE/DESTINATARIO --- */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid size={12}>
              <TableContainer sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900, whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prodotto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Qualità</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Imballaggio</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prezzo Imballaggio</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Colli</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prezzo Prodotto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Peso lordo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Peso netto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Tot Kg</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} ></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiBolla.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Autocomplete
                            sx={{ width: 175 }}
                            options={prodotti}
                            getOptionLabel={(p) => `${p.id} - ${p.nome}`}
                            value={prodotti.find(p => p.nome === r.nomeProdotto) || null}
                            onChange={(_, newValue) => handleProdottoChange(i, 'nomeProdotto', newValue ? newValue.nome : '')}
                            blurOnSelect
                            onClose={(_, reason) => {
                              if (reason === 'selectOption') {
                                // dopo chiusura dropdown per selezione, focus sul campo Prezzo
                                prezzoRefs.current[i]?.focus();
                              }
                            }}
                            autoHighlight
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                variant="standard"
                                label="Prodotto"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            sx={{ width: 175 }}
                            label="Qualità"
                            fullWidth variant="standard" value={r.qualita} onChange={e => handleProdottoChange(i, 'qualita', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }} />
                        </TableCell>
                        {/* Imballaggio Autocomplete */}
                        <TableCell>
                          <Autocomplete
                            sx={{ width: 175 }}
                            size="small"
                            open={openImballaggioIndex === i}
                            onOpen={() => setOpenImballaggioIndex(i)}
                            onClose={() => setOpenImballaggioIndex(null)}
                            autoHighlight
                            options={imballaggi}
                            getOptionLabel={im => `${im.id} - ${im.tipo}`}
                            value={imballaggi.find(im => im.tipo === r.nomeImballaggio) || null}
                            onChange={(_, newValue) => handleProdottoChange(i, 'nomeImballaggio', newValue ? newValue.tipo : '')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && openImballaggioIndex !== i) {
                                e.preventDefault();
                                handleEnterKeyDown(e);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                margin="dense"
                                fullWidth
                                variant="standard"
                                label="Imballaggio"
                              />
                            )}
                          />
                        </TableCell>
                        {/* Prezzo Imballaggio */}
                        <TableCell>
                          <TextField
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="text"
                            value={r.prezzoImballaggio}
                            InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                          />
                        </TableCell>
                        {/* Colli */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.numeroColli}
                            onChange={e => handleProdottoChange(i, 'numeroColli', +e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                            inputProps={{ inputMode: 'numeric', step: '1', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                          />
                        </TableCell>
                        {/* Prezzo prodotto */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.prezzo}
                            onChange={e => handleProdottoChange(i, 'prezzo', +e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                          />
                        </TableCell>
                        {/* Peso lordo */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoLordo}
                            onChange={e => handleProdottoChange(i, 'pesoLordo', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                          />
                        </TableCell>
                        {/* Peso netto */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoNetto}
                            onChange={e => handleProdottoChange(i, 'pesoNetto', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                          />
                        </TableCell>
                        {/* Tot Kg */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 75, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.totKgSpediti}
                            onChange={e => handleProdottoChange(i, 'totKgSpediti', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProdotto(); } }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveProdotto(i)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
          </Grid>
        </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" className='btn' onClick={handleSubmit}>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}