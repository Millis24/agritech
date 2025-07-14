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
  isBollaBis: boolean;
  isBollaGenerica: boolean;
}

export default function AddBollaDialog({
  open, onClose, onSave, clienti, prodotti, imballaggi, numeroBolla, bolla, isBollaBis, isBollaGenerica
}: BollaDialogProps) {
  const [destinatario, setDestinatario] = useState({
    nome: '',
    cognome: '',
    ragioneSociale: '',
    via: '',
    numeroCivico: '',
    cap: '',
    paese: '',
    provincia: '',
    email: '',
    telefonoFisso: '',
    telefonoCell: '',
    partitaIva: '',
    codiceSDI: ''
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
  if (bolla && isBollaBis) {
    const cli = clienti.find(
      c =>
        c.nomeCliente.toLowerCase().trim() ===
        bolla.destinatarioNome.toLowerCase().trim()
    );
    if (cli) {
      setSelectedClienteId(cli.id);
      setDestinatario({
        nome: cli.nomeCliente,
        cognome: cli.cognomeCliente || '',
        ragioneSociale: cli.ragioneSociale || '',
        via: cli.via,
        numeroCivico: cli.numeroCivico,
        cap: cli.cap || '',
        paese: cli.paese || '',
        provincia: cli.provincia || '',
        email: cli.email,
        telefonoFisso: cli.telefonoFisso,
        telefonoCell: cli.telefonoCell,
        partitaIva: cli.partitaIva,
        codiceSDI: cli.codiceSDI
      });
    }
    setDataOra(new Date().toISOString().slice(0, 16));
    setDestTipo('sede');
    setIndirizzoDestinazione(bolla.indirizzoDestinazione);
    setCausale(bolla.causale);
    setConsegnaACarico(bolla.consegnaACarico);
    setVettore(bolla.vettore);
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
    return; // impedisce il reset sotto
  }

  if (bolla) {
    if (!isBollaGenerica && bolla.destinatarioNome) {
      const cli = clienti.find(
        c =>
          c.nomeCliente === bolla.destinatarioNome ||
          c.ragioneSociale === bolla.destinatarioNome
      );
      if (cli) {
        setSelectedClienteId(cli.id);
        setDestinatario({
          nome: cli.nomeCliente,
          cognome: cli.cognomeCliente || '',
          ragioneSociale: cli.ragioneSociale || '',
          via: cli.via,
          numeroCivico: cli.numeroCivico,
          cap: cli.cap || '',
          paese: cli.paese || '',
          provincia: cli.provincia || '',
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
      ragioneSociale: '',
      via: '',
      numeroCivico: '',
      cap: '',
      paese: '',
      provincia: '',
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
      numeroColli: 0, pesoLordo: 0, pesoNetto: 0
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
    let numeroFinale = bolla?.numeroBolla?.toString() ?? numeroBolla.toString();

    if (isBollaBis && bolla) {
      numeroFinale = `${bolla.numeroBolla}/bis`;
    } else if (isBollaGenerica) {
      numeroFinale = `${numeroBolla}/generica`;
    }
    const baseBolla = {
      numeroBolla: numeroFinale,
      dataOra: new Date(dataOra).toISOString(),
      destinatarioNome: isBollaGenerica ? destinatario.nome : selectedClienteObj?.ragioneSociale || destinatario.nome,
      destinatarioCognome: destinatario.cognome,
      destinatarioVia: destinatario.via,
      destinatarioNumeroCivico: destinatario.numeroCivico,
      destinatarioEmail: destinatario.email,
      destinatarioTelefonoFisso: destinatario.telefonoFisso,
      destinatarioTelefonoCell: destinatario.telefonoCell,
      destinatarioPartitaIva: destinatario.partitaIva,
      destinatarioCodiceSDI: destinatario.codiceSDI,
      indirizzoDestinazione: destTipo === 'sede' ? `${destinatario.via} ${destinatario.numeroCivico}` : indirizzoDestinazione,
      causale,
      prodotti: JSON.stringify(prodottiBolla),
      daTrasportare: JSON.stringify(prodottiBolla.map(p => ({ nomeImballaggio: p.nomeImballaggio, numeroColli: p.numeroColli }))),
      daRendere: JSON.stringify(prodottiBolla.map(p => ({ nomeImballaggio: p.nomeImballaggio, numeroColli: 0 }))),
      consegnaACarico,
      vettore,
      createdAt: new Date().toISOString(),
      synced: false
    };

    const nuovaBolla = (!isBollaBis && bolla && bolla.id !== undefined)
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
      <DialogTitle>
        {isBollaGenerica
          ? 'Nuova Bolla Generica'
          : isBollaBis
            ? 'Bolla Bis'
            : bolla ? 'Modifica Bolla' : 'Nuova Bolla'}
      </DialogTitle>
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
                  options={['Vendita', 'Prezzo da determinare', 'Reso']}
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
                  value={
                      isBollaBis && bolla
                        ? `${bolla.numeroBolla}/bis`
                        : bolla
                          ? bolla.numeroBolla
                          : numeroBolla
                    }
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
                {!isBollaGenerica && (
                  <Autocomplete
                    options={clienti}
                    getOptionLabel={(option) => `${option.id} - ${option.nomeCliente}`}
                    value={clienti.find(c => c.id === selectedClienteId) || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setSelectedClienteId(newValue.id);
                        setDestinatario({
                          nome: newValue.nomeCliente,
                          cognome: newValue.cognomeCliente,
                          ragioneSociale: newValue.ragioneSociale || '',
                          via: newValue.via,
                          numeroCivico: newValue.numeroCivico,
                          cap: newValue.cap || '',
                          paese: newValue.paese || '',
                          provincia: newValue.provincia || '',
                          email: newValue.email,
                          telefonoFisso: newValue.telefonoFisso,
                          telefonoCell: newValue.telefonoCell,
                          partitaIva: newValue.partitaIva,
                          codiceSDI: newValue.codiceSDI
                        });
                      } else {
                        setSelectedClienteId('');
                        setDestinatario({
                          nome: '',
                          cognome: '',
                          ragioneSociale: '',
                          via: '',
                          numeroCivico: '',
                          cap: '',
                          paese: '',
                          provincia: '',
                          email: '',
                          telefonoFisso: '',
                          telefonoCell: '',
                          partitaIva: '',
                          codiceSDI: ''
                        });
                      }
                    }}
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
                )}
              </Grid>
              {/* Consegna a carico */}
              <Grid size={12}>
                <Autocomplete
                  size="small"
                  options={[ 'Destinatario', 'Mittente', 'Vettore' ]}
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
                  options={[ 'S.C. Americana s.r.l.', 'Mittente', 'Destinatario' ]}
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
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Ragione Sociale"
                  value={destinatario.nome}
                  onChange={(e) => setDestinatario({ ...destinatario, nome: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Cognome */}
              {/* <Grid size={6}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Cognome"
                  value={destinatario.cognome}
                  onChange={(e) => setDestinatario({ ...destinatario, cognome: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid> */}
              {/* Ragione Sociale */}
              {/* <Grid size={12}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Ragione Sociale"
                  value={destinatario.ragioneSociale || ''}
                  onChange={(e) => setDestinatario({ ...destinatario, ragioneSociale: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid> */}
              {/* Via */}
              <Grid size={6}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Via"
                  value={destinatario.via}
                  onChange={(e) => setDestinatario({ ...destinatario, via: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Numero civico */}
              <Grid size={6}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Numero"
                  value={destinatario.numeroCivico}
                  onChange={(e) => setDestinatario({ ...destinatario, numeroCivico: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* CAP */}
              <Grid size={4}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="CAP"
                  value={destinatario.cap || ''}
                  onChange={(e) => setDestinatario({ ...destinatario, cap: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Paese */}
              <Grid size={4}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Paese"
                  value={destinatario.paese || ''}
                  onChange={(e) => setDestinatario({ ...destinatario, paese: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Provincia */}
              <Grid size={4}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Provincia"
                  value={destinatario.provincia || ''}
                  onChange={(e) => setDestinatario({ ...destinatario, provincia: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Partita IVA */}
              <Grid size={6}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Partita IVA"
                  value={destinatario.partitaIva}
                  onChange={(e) => setDestinatario({ ...destinatario, partitaIva: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
              {/* Telefono */}
              <Grid size={6}>
                <TextField
                  className={!isBollaGenerica ? 'input-tondi' : ''}
                  fullWidth
                  label="Telefono"
                  value={destinatario.telefonoCell || destinatario.telefonoFisso}
                  onChange={(e) => setDestinatario({ ...destinatario, telefonoCell: e.target.value })}
                  variant={isBollaGenerica ? "standard" : "filled"}
                  InputProps={{ readOnly: !isBollaGenerica, disableUnderline: !isBollaGenerica }}
                  inputProps={!isBollaGenerica ? { tabIndex: -1 } : undefined}
                />
              </Grid>
            </Grid>
              
          </Grid>
        </Grid>
        {/* --- FINE BLOCCO DATI CLIENTE/DESTINATARIO --- */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid size={12}>
              <TableContainer sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1100, whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prodotto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Qualità</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Imballaggio</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prezzo Imballaggio</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Colli</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Peso lordo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Peso netto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold'}} >Prezzo Prodotto</TableCell>
                      {/* <TableCell sx={{ fontWeight: 'bold'}} >Tot Kg</TableCell> */}
                      <TableCell sx={{ fontWeight: 'bold'}} ></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiBolla.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {!isBollaGenerica ? (
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
                          ) : (
                            <TextField
                              sx={{ width: 175 }}
                              fullWidth
                              variant="standard"
                              label="Prodotto"
                              value={r.nomeProdotto}
                              onChange={e => handleProdottoChange(i, 'nomeProdotto', e.target.value)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            sx={{ width: 175 }}
                            label="Qualità"
                            fullWidth variant="standard" value={r.qualita} onChange={e => handleProdottoChange(i, 'qualita', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }} />
                        </TableCell>
                        {/* Imballaggio: Autocomplete per bolla normale, TextField per generica */}
                        <TableCell>
                          {!isBollaGenerica ? (
                            <Autocomplete
                              sx={{ width: 175 }}
                              options={imballaggi}
                              getOptionLabel={(i) => i.tipo}
                              value={imballaggi.find(im => im.tipo === r.nomeImballaggio) || null}
                              onChange={(_, newValue) => handleProdottoChange(i, 'nomeImballaggio', newValue ? newValue.tipo : '')}
                              autoHighlight
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  fullWidth
                                  variant="standard"
                                  label="Imballaggio"
                                />
                              )}
                            />
                          ) : (
                            <TextField
                              sx={{ width: 175 }}
                              fullWidth
                              variant="standard"
                              label="Imballaggio"
                              value={r.nomeImballaggio}
                              onChange={e => handleProdottoChange(i, 'nomeImballaggio', e.target.value)}
                            />
                          )}
                        </TableCell>
                        {/* Prezzo Imballaggio */}
                        <TableCell>
                          <TextField
                            sx={{ width: 100, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.prezzoImballaggio}
                            onChange={e => handleProdottoChange(i, 'prezzoImballaggio', +e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                          />
                        </TableCell>
                        {/* Colli */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 100, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.numeroColli === 0 ? '' : r.numeroColli}
                            onChange={e => handleProdottoChange(i, 'numeroColli', +e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                            inputProps={{ inputMode: 'numeric', step: '1', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                          />
                        </TableCell>
                        {/* Peso lordo */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 100, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoLordo === 0 ? '' : r.pesoLordo}
                            onChange={e => handleProdottoChange(i, 'pesoLordo', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                          />
                        </TableCell>
                        {/* Peso netto */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 100, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.pesoNetto === 0 ? '' : r.pesoNetto}
                            onChange={e => handleProdottoChange(i, 'pesoNetto', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnterKeyDown(e); } }}
                          />
                        </TableCell>
                        {/* Prezzo prodotto */}
                        <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 100, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.prezzo === 0 ? '' : r.prezzo}
                            onChange={e => handleProdottoChange(i, 'prezzo', +e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start">€</InputAdornment>) }}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProdotto(); } }}
                          />
                        </TableCell>
                        {/* Tot Kg */}
                        {/* <TableCell>
                          <TextField
                            size="small"
                            sx={{ width: 125, marginTop: '16px' }}
                            fullWidth
                            variant="standard"
                            type="number"
                            value={r.totKgSpediti}
                            onChange={e => handleProdottoChange(i, 'totKgSpediti', +e.target.value)}
                            inputProps={{ inputMode: 'decimal', step: 'any', onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select() }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProdotto(); } }}
                          />
                        </TableCell> */}
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
        <Button
          type="button"
          onClick={async () => {
            const result = await Swal.fire({
              title: 'Sei sicuro di voler annullare?',
              text: 'Le modifiche non salvate andranno perse.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sì, annulla',
              cancelButtonText: 'No, torna indietro',
              reverseButtons: true,
            });
            if (result.isConfirmed) onClose();
          }}
          className='btn-neg'
        >Annulla</Button>
        <Button type="submit" variant="contained" className='btn' onClick={handleSubmit}>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}