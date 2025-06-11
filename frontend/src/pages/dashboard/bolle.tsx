import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress, TextField } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
declare module '*.png';
import logoDataUrl from '../../assets/logo_bolle.png';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import AddBollaDialog from '../../components/addBollaDialog';
import useBolleSync from '../../sync/useBolleSync';

import { getAllBolle, saveBolla, deleteBolla as deleteLocalBolla, type Bolla, getBolleEliminate } from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { getAllProdotti, type Prodotto } from '../../storage/prodottiDB';
import { getAllImballaggi, type Imballaggio } from '../../storage/imballaggiDB';

import Swal from 'sweetalert2';

interface ImballaggioRow {
  tipo: string;
  valore: string;
  inGiacenza: string;
  daTrasporto: string;
  daRendere: string;
}

export default function Bolle() {
  // dati all'interno della bolla dai vari componenti
  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bolla | null>(null);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [loading, setLoading] = useState(true);

  // ricarica dati bolla -> dovrebbe anche sistemare il problema dell'eliminazione offline/online
  const ricaricaDati = async () => {
    const [bolleData, clientiData, prodottiData, imballaggiData] = await Promise.all([
      getAllBolle(),
      getAllClienti(),
      getAllProdotti(),
      getAllImballaggi()
    ]);
    // id eliminati
    const eliminatiIds = (await getBolleEliminate()).map(b => b.id);
    // filtra le bolle visibili dopo l'eliminazione
    const bolleVisibili = bolleData
      .filter(b => b.id !== undefined)
      .filter(b => !eliminatiIds.includes(b.id!));
    
    setBolle(bolleVisibili);
    setClienti(clientiData);
    setProdotti(prodottiData);
    setImballaggi(imballaggiData);
  };

  useEffect(() => {
    (async () => {
      await ricaricaDati();
      setLoading(false);
    })();
  }, []);

  useBolleSync();

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/bolle/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await deleteLocalBolla(id); // elimina le bolle online
          alert('✅ Bolla eliminata online');
        } else {
          alert('❌ Errore nella cancellazione online');
        }
      } catch {
        alert('❌ Errore di rete');
      }
    } else {
      await markBollaAsDeleted(id); // elimina le bolle offline
      alert('⚠️ Eliminato offline, sarà sincronizzato');
    }
    await ricaricaDati();
  };

  // ————————————————————————————————————————————————
  // Stampa in PDF con layout custom
  // ————————————————————————————————————————————————
  function handlePrint(bolla: Bolla) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const M = 10;             // margine
    doc.setFont('helvetica');

    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo (placeholder)
    const logoW = 60;
    const logoH = 30;
    const logoX = (pageWidth - logoW) / 2;
    const logoY = 10;
    let cursorY = M;        
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    doc.setFontSize(16);

    const marginBottomLogo = cursorY + 10;
    cursorY = marginBottomLogo;
    cursorY += 2;


    // MITTENTE
    const mittX = M;
    const mittW = 90;
    cursorY += 24;
    doc.setLineWidth(0.5);
    doc.rect(mittX, cursorY, mittW, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Morselli Dottor Antonio', mittX + 4, cursorY + 8);
    doc.setFont('helvetica', 'regular');
    doc.setFontSize(9);
    doc.text('Via Gallerana 28, 41030 Staggia (MO)', mittX + 4, cursorY + 14);
    doc.text('Tel. 329 97 80 703 · Fax 059 90 60 01', mittX + 4, cursorY + 19);
    doc.text('Mail: anguriadimodena@gmail.com', mittX + 4, cursorY + 24);
    doc.text('PEC: antonio.morselli@pec.agritel.it', mittX + 4, cursorY + 29);
    doc.text('P.IVA 03235970369 · Cod. Fisc. MRSNTN81A12E897H', mittX + 4, cursorY + 34);
    doc.text('Iscriz. B.N.D.O.O. n°059906001', mittX + 4, cursorY + 39);

    // DESTINATARIO
    const destX = mittX + mittW + 10;
    const destW = 90;
    doc.rect(destX, cursorY, destW, 50);
    doc.setFontSize(10);
    doc.text('Destinatario:', destX + 4, cursorY + 6);
    doc.setFontSize(12);
    doc.text(bolla.destinatarioNome, destX + 4, cursorY + 16);
    doc.setFontSize(9);
    doc.text(bolla.destinatarioIndirizzo, destX + 4, cursorY + 22);
    doc.text(`Mail: ${bolla.destinatarioEmail}`, destX + 4, cursorY + 28);
    doc.text(`Tel.: ${bolla.destinatarioTelefono}`, destX + 4, cursorY + 33);
    doc.text(`P.IVA: ${bolla.destinatarioPartitaIva}`, destX + 4, cursorY + 38);
    doc.text(`SDI: ${bolla.destinatarioCodiceSDI}`, destX + 4, cursorY + 43);

    // linea di separazione
    doc.setLineWidth(0.5);
    const boxBottom = cursorY + 50;
    doc.line(mittX, boxBottom + 5, destX + destW, boxBottom + 5);

    // doc trasporto + data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DOCUMENTO DI TRASPORTO (D.P.R. 472 del 14/08/96): \n${bolla.numeroBolla}`, mittX, boxBottom + 12); 
    doc.setFont('helvetica', 'regular');
    doc.text(`Data: ${new Date(bolla.dataOra).toLocaleString()}`, destX, boxBottom + 12);

    // spazio giusto
    const marginBottom = cursorY + 10;
    cursorY = marginBottom;
    cursorY += 2;

    doc.setFontSize(12);

    // INDIRIZZO DESTINAZIONE & SEDE
    cursorY += 60;
    doc.setFontSize(10);
    doc.rect(M, cursorY, 95, 8);
    doc.rect(M + 95, cursorY, 95, 8);
    doc.setFont('helvetica', 'bold');
    doc.text('Indirizzo di destinazione:', M + 2, cursorY + 6);
    doc.setFont('helvetica', 'regular');
    doc.text(bolla.indirizzoDestinazione, M + 97, cursorY + 6);

    // CAUSALE / VENDITA
    cursorY += 16;
    doc.rect(M, cursorY, 95, 8);
    doc.rect(M + 95, cursorY, 95, 8);
    doc.setFont('helvetica', 'bold');
    doc.text('Causale del trasporto:', M + 2, cursorY + 6);
    doc.setFont('helvetica', 'regular');
    doc.text(bolla.causale, M + 97, cursorY + 6);

    // TABELLA PRODOTTI
    cursorY += 16;
    const prodotti = JSON.parse(bolla.prodotti) as Array<{
      nomeProdotto: string;
      qualita: string;
      prezzo: number;
      nomeImballaggio: string;
      numeroColli: number;
      pesoLordo: number;
      pesoNetto: number;
      totKgSpediti: number;
    }>;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: M, right: M },
      tableWidth: pageWidth - 2 * M,
      head: [[
        'Prodotto','Qualità','Prezzo','Imballaggio','N° Colli','Peso lordo','Peso netto'
      ]],
      body: prodotti.map(p => [
        p.nomeProdotto,
        p.qualita,
        p.prezzo.toString(),
        p.nomeImballaggio,
        p.numeroColli.toString(),
        p.pesoLordo.toString(),
        p.pesoNetto.toString(),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { textColor: [255, 255, 255] },
    });
    const afterTableY = (doc as any).lastAutoTable.finalY || cursorY;

    // TOTALI KG
    const totKg = prodotti.reduce((s, p) => s + p.totKgSpediti, 0);
    doc.setFontSize(9);
    doc.text(`Totale kg spediti in questa consegna: ${totKg}`, M, afterTableY + 6);
    doc.text(`Totale KG angurie spediti in questa stagione:`, M + 110, afterTableY + 6);

    // IMBALLAGGI A RENDERE
    const trasportoArr = JSON.parse(bolla.daTrasportare) as Array<{ nomeImballaggio: string; numeroColli: number }>;
    const rendArr = JSON.parse(bolla.daRendere) as Array<{ nomeImballaggio: string; numeroColli: number }>;
    const imballaggiData: ImballaggioRow[] = trasportoArr.map((d, i) => ({
      tipo: d.nomeImballaggio,
      valore: imballaggi.find(im => im.tipo === d.nomeImballaggio)?.prezzo.toString() ?? '',
      inGiacenza: '',
      daTrasporto: d.numeroColli.toString(),
      daRendere: rendArr[i]?.numeroColli.toString() ?? '',
    }));
    autoTable(doc, {
      startY: afterTableY + 12,
      margin: { left: M, right: M },
      tableWidth: pageWidth - 2 * M,
      head: [[
        'Tipologia','Valore','In Vs giacenza','Da trasporto attuale','Totali a rendere'
      ]],
      body: imballaggiData.map(r => [
        r.tipo, r.valore, r.inGiacenza, r.daTrasporto, r.daRendere
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { textColor: [255, 255, 255] },
    });
    const afterImbY = (doc as any).lastAutoTable.finalY || (afterTableY + 12);

    // BARRA RESTITUZIONE E NOTE
    const restY = afterImbY + 8;
    doc.rect(M, restY, 180, 20);
    doc.setFontSize(12);
    
    const tempoText = 'Tempo concesso per la restituzione degli imballaggi a rendere (in giorni): 15';
    doc.setFont('helvetica', 'bold');
    doc.text(tempoText,  M + 2, restY + 6);
    const tmpWidth = doc.getTextWidth(tempoText);
    doc.setLineWidth(0.5);
    doc.line(M + 2, restY + 7, M + 2 + tmpWidth, restY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Si ricorda che, in base agli accordi contrattuali presi, la mancata e/o la parziale restituzione entro I termini prefissati degli
Imballaggi a rendere comporta il pagamento di una penale pari al valore degli imballaggi non resi. 
Per contestazione di qualità, prezzo e peso la merce va restituita entro 48 ore dall'arrivo. Spese a carico del cendente.`, M + 2, restY + 11);
    //doc.text(`Per contestazione di qualità, prezzo e peso la merce va restituita entro 48 ore dall'arrivo. Spese a carico del cendente.`, M + 2, restY + 16);

    const fY = restY + 30;
    // box “Consegna a carico del”
    doc.rect(M, fY, mittW, 12);
    doc.text('Consegna a carico del:', M + 2, fY + 6);
    doc.text(bolla.consegnaACarico, M + mittW - 40, fY + 6);

    // box “Vettore”
    const vettX = M + mittW + 10;
    doc.rect(vettX, fY, mittW, 12);
    doc.text('Vettore:', vettX + 2, fY + 6);
    doc.text(bolla.vettore, vettX + mittW - 40, fY + 6);

    // FIRME
    doc.text('Firma Conducente 1', M, fY + 22);
    doc.line(M, fY + 24, M + 50, fY + 24);
    doc.text('Firma Conducente 2', M + 60, fY + 22);
    doc.line(M + 60, fY + 24, M + 110, fY + 24);
    doc.text('Firma Destinatario', M + 115, fY + 22);
    doc.line(M + 115, fY + 24, M + 175, fY + 24);

    // Salva PDF
    doc.save(`bolla n. ${bolla.numeroBolla}.pdf`);
  }

  // filtri per tabella bolle
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(''); // ISO yyyy-MM-dd
  const [dateTo, setDateTo]   = useState<string>('');
  
  // funzione per i filtri da mettere in <DataGrid>
  // filtraggio combinato
  const filteredBolle = bolle.filter((b) => {
    // filtro per cliente, se vuoto passa tutto
    const byCliente = filterCliente
      ? b.destinatarioNome.toLowerCase().includes(filterCliente.toLowerCase())
      : true;

    // filtro per date
    const dataBolla = new Date(b.dataOra);
    const fromOK = dateFrom ? dataBolla >= new Date(dateFrom) : true;
    const toOK   = dateTo   ? dataBolla <= new Date(dateTo)   : true;

    return byCliente && fromOK && toOK;
  });

  // tabella bolle
  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOra', headerName: 'Data', width: 150 },
    { field: 'destinatarioNome', headerName: 'Destinatario', width: 200 },
    { field: 'indirizzoDestinazione', headerName: 'Indirizzo di Destinazione', width: 250 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      renderCell: params => (
        <>
          <IconButton onClick={() => { setEditing(params.row); setOpen(true); }}><EditIcon/></IconButton>
          {/* <IconButton onClick={() => handleDelete(params.row.id)}><DeleteIcon/></IconButton> */}
          <IconButton onClick={() => {
            Swal.fire({
                title: `Eliminare la bolla n. ${params.row.numeroBolla}?`,
                text: "Questa operazione non può essere annullata.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sì, elimina',
                cancelButtonText: 'No, annulla',
                reverseButtons: true,
              }).then((result) => {
                if (result.isConfirmed) {
                  handleDelete(params.row.id);
                  Swal.fire(
                    'Eliminata!',
                    `La bolla n. ${params.row.numeroBolla} è stata eliminata.`,
                    'success'
                  );
                }
              });
            }}>
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={() => handlePrint(params.row)}><PrintIcon/></IconButton>
        </>
      )
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestione Bolle</Typography>
        <Button variant="contained" onClick={() => {
          if (clienti.length && prodotti.length && imballaggi.length) {
            setEditing(null); setOpen(true);
          } else {
            alert("⏳ Attendi il caricamento dei dati prima di aggiungere una bolla.");
          }
        }}>Aggiungi Bolla</Button>
      </Box>

      {/* Filtri  */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button variant="contained" onClick={() => { setFilterCliente(''); setDateFrom(''); setDateTo(''); }}> Tutti </Button>
        <TextField size="small" label="Nome Cliente" value={filterCliente} onChange={e => setFilterCliente(e.target.value)} />
        <TextField size="small" label="Da" type="date" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <TextField size="small" label="A" type="date" InputLabelProps={{ shrink: true }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <Button variant="contained" color="secondary" onClick={() => { setFilterCliente(''); setDateFrom(''); setDateTo(''); }} > Pulisci filtri <DeleteForeverIcon/> </Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid rows={filteredBolle} columns={columns} getRowId={row => row.id!} initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }} pageSizeOptions={[5, 10]}/>
      </div>

      <AddBollaDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        bolla={editing}
        onSave={async bolla => {
          if (navigator.onLine) {
            try {
              const res = bolla.id
                ? await fetch(`http://localhost:4000/api/bolle/${bolla.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(bolla)
                  })
                : await fetch('http://localhost:4000/api/bolle', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(bolla)
                  });

              if (res.ok) {
                const nb = await res.json();
                await saveBolla({...nb, synced:true, modifiedOffline:false});
              } else {
                console.error(await res.text());
                await saveBolla({...bolla, synced:false, modifiedOffline:!!bolla.id});
              }
            } catch {
              await saveBolla({...bolla, synced:false, modifiedOffline:!!bolla.id});
            }
          } else {
            const tempId = Date.now();
            await saveBolla({...bolla, id:bolla.id||tempId, synced:false, modifiedOffline:!!bolla.id});
          }
          await ricaricaDati();
          setOpen(false);
        }}
        clienti={clienti}
        prodotti={prodotti}
        imballaggi={imballaggi}
        numeroBolla={bolle.length > 0 ? Math.max(...bolle.map(b=>b.numeroBolla))+1 : 1}
      />
    </Box>
  );
}