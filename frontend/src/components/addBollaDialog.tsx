import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Typography, Grid,
  InputAdornment, IconButton
} from '@mui/material';
import { Tabs, Tab, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Cliente } from '../storage/clientiDB';
import type { Prodotto } from './addProdottoDialog';
import type { Imballaggio } from './addImballaggioDialog';
import type { Bolla } from '../storage/bolleDB';
import Swal from 'sweetalert2';
import { Autocomplete, Table, TableContainer, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import type { AutocompleteChangeReason } from '@mui/material';

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

  const [tabProdotto, setTabProdotto] = useState(0);

  // Tab section for Prodotti/Imballaggi
  const [tabSection, setTabSection] = useState(0);
  const [imballaggiBolla, setImballaggiBolla] = useState<any[]>([]);

  const handleAddImballaggio = () => {
    setImballaggiBolla([...imballaggiBolla, { nomeImballaggio: '', prezzo: 0, numeroColli: 0 }]);
  };

  const handleImballaggioChange = (index: number, field: string, value: any) => {
    const nuovi = [...imballaggiBolla];
    nuovi[index][field] = value;
    if (field === 'nomeImballaggio') {
      const im = imballaggi.find(i => i.tipo === value);
      if (im) nuovi[index].prezzo = im.prezzo;
    }
    setImballaggiBolla(nuovi);
  };

  const handleRemoveImballaggio = (index: number) => {
    const nuovi = [...imballaggiBolla];
    nuovi.splice(index, 1);
    setImballaggiBolla(nuovi);
  };

  // Move focus to next input on Enter
  const handleEnterKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget;
      const focusable = Array.from(form.querySelectorAll<HTMLElement>('input, textarea, select, button'))
        .filter(el => !el.hasAttribute('disabled') && el.tabIndex >= 0);
      const index = focusable.indexOf(e.target as HTMLElement);
      const next = focusable[index + 1] || focusable[0];
      next.focus();
    }
  };

  function a11yProps(index: number) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }

  function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
      </div>
    );
  }

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus disableAutoFocus className="custom-dialog">
      <DialogTitle>{bolla ? 'Modifica Bolla' : 'Nuova Bolla'}</DialogTitle>
      <DialogContent>
        <form onKeyDown={handleEnterKeyDown} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Grid container spacing={4}>
          <Grid size={6}>
            <Grid container spacing={2}>
              {/* Causale */}
              <Grid size={12}>
                <TextField
                  className='input-tondi'
                  select
                  fullWidth
                  label="Causale di trasporto"
                  value={causale}
                  onChange={(e) => setCausale(e.target.value)}
                >
                  <MenuItem value="Vendita">Vendita</MenuItem>
                  <MenuItem value="Conto visione">Conto visione</MenuItem>
                  <MenuItem value="Reso">Reso</MenuItem>
                </TextField>
              </Grid>
              {/* Numero Bolla */}
              <Grid size={12}>
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
                  renderInput={(params) => (
                    <TextField {...params} className='input-tondi' fullWidth label="Cliente" />
                  )}
                />
              </Grid>
              {/* Partita IVA */}
              <Grid size={12}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Partita IVA"
                  value={selectedClienteObj?.partitaIva || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {/* Telefono */}
              <Grid size={12}>
                <TextField
                  className='input-tondi'
                  fullWidth
                  label="Telefono"
                  value={selectedClienteObj?.telefonoCell || selectedClienteObj?.telefonoFisso || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={6}>
            <Typography variant="h6">Info Cliente</Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField fullWidth label="Nome" value={destinatario.nome} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Cognome" value={destinatario.cognome} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Ragione Sociale"
                  value={selectedClienteObj?.ragioneSociale || selectedClienteObj?.nomeCliente || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Via" value={destinatario.via} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Numero" value={destinatario.numeroCivico} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="CAP" value={selectedClienteObj?.cap || ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Paese" value={selectedClienteObj?.paese || ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Provincia" value={selectedClienteObj?.provincia || ''} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {/* --- FINE BLOCCO DATI CLIENTE/DESTINATARIO --- */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid size={12}>
            <Tabs value={tabSection} onChange={(_, v) => setTabSection(v)} variant="fullWidth">
              <Tab label="Prodotti" {...a11yProps(0)} />
              <Tab label="Imballaggi" {...a11yProps(1)} />
            </Tabs>
            <TabPanel value={tabSection} index={0}>
              <TableContainer sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900, whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell>Qualità</TableCell>
                      <TableCell>Prezzo</TableCell>
                      <TableCell>Peso lordo</TableCell>
                      <TableCell>Peso netto</TableCell>
                      <TableCell>Tot Kg</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiBolla.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ width: 300 }}>
                          <Autocomplete
                            options={prodotti}
                            getOptionLabel={(p) => `${p.id} - ${p.nome}`}
                            value={prodotti.find(p => p.nome === r.nomeProdotto) || null}
                            onChange={(event, v, reason) => {
                              handleProdottoChange(i, 'nomeProdotto', v ? v.nome : '');
                              if (reason === 'selectOption') {
                                handleEnterKeyDown(event as React.KeyboardEvent<HTMLElement>);
                              }
                            }}
                            onKeyDown={handleEnterKeyDown}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                variant="standard"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            value={r.qualita}
                            onChange={(e) => handleProdottoChange(i, 'qualita', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.prezzo}
                            onChange={(e) => handleProdottoChange(i, 'prezzo', +e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoLordo}
                            onChange={(e) => handleProdottoChange(i, 'pesoLordo', +e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoNetto}
                            onChange={(e) => handleProdottoChange(i, 'pesoNetto', +e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.totKgSpediti}
                            onChange={(e) => handleProdottoChange(i, 'totKgSpediti', +e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddProdotto();
                              }
                            }}
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
            </TabPanel>
            <TabPanel value={tabSection} index={1}>
              <Button variant="outlined" onClick={handleAddImballaggio} className='btn-neg'>+ Aggiungi Imballaggio</Button>
              <TableContainer sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900, whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Imballaggio</TableCell>
                      <TableCell>Prezzo</TableCell>
                      <TableCell>Colli</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {imballaggiBolla.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Autocomplete
                            options={imballaggi}
                            getOptionLabel={im => `${im.id} - ${im.tipo}`}
                            value={imballaggi.find(im => im.tipo === r.nomeImballaggio) || null}
                            onChange={(_, v) => handleImballaggioChange(i, 'nomeImballaggio', v ? v.tipo : '')}
                            renderInput={params => <TextField {...params} fullWidth variant="standard" />}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.prezzo}
                            InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.numeroColli}
                            onChange={e => handleImballaggioChange(i, 'numeroColli', +e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveImballaggio(i)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Grid>
        </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose} className='btn-neg'>Annulla</Button>
        <Button type="submit" variant="contained" className='btn'>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}