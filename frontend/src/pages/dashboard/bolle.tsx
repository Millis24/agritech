import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
declare module '*.png';
import logoDataUrl from '../../assets/logo_bolle.png';

import AddBollaDialog from '../../components/addBollaDialog';
import useBolleSync from '../../sync/useBolleSync';

import {
  getAllBolle,
  saveBolla,
  deleteBolla as deleteLocalBolla,
  type Bolla,
  getBolleEliminate
} from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { getAllProdotti, type Prodotto } from '../../storage/prodottiDB';
import { getAllImballaggi, type Imballaggio } from '../../storage/imballaggiDB';

interface ImballaggioRow {
  tipo: string;
  valore: string;
  inGiacenza: string;
  daTrasporto: string;
  daRendere: string;
}

export default function Bolle() {
  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bolla | null>(null);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [imballaggi, setImballaggi] = useState<Imballaggio[]>([]);
  const [loading, setLoading] = useState(true);

  const ricaricaDati = async () => {
    const [bolleData, clientiData, prodottiData, imballaggiData] = await Promise.all([
      getAllBolle(),
      getAllClienti(),
      getAllProdotti(),
      getAllImballaggi()
    ]);

    const eliminatiIds = (await getBolleEliminate()).map(b => b.id);

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
          await deleteLocalBolla(id);
          alert('✅ Bolla eliminata online');
        } else {
          alert('❌ Errore nella cancellazione online');
        }
      } catch {
        alert('❌ Errore di rete');
      }
    } else {
      await markBollaAsDeleted(id);
      alert('⚠️ Eliminato offline, sarà sincronizzato');
    }
    await ricaricaDati();
  };

  // ————————————————————————————————————————————————
  // Stampa in PDF con layout custom
  // ————————————————————————————————————————————————
  function handlePrint(bolla: Bolla) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const M = 10;             // margin
    let cursorY = M;

    // Logo (placeholder)
    doc.setDrawColor(200);
    doc.rect(M, cursorY, 40, 20);
    doc.setFontSize(10);
    doc.addImage(logoDataUrl, 'PNG', 10, 10, 40, 20);
    doc.setFontSize(16);

    // MITTENTE
    const mittX = M;
    const mittW = 90;
    cursorY += 24;
    doc.setLineWidth(0.5);
    doc.rect(mittX, cursorY, mittW, 50);
    doc.setFontSize(12);
    doc.text('Morselli Dottor Antonio', mittX + 4, cursorY + 8);
    doc.setFontSize(9);
    doc.text('Via Gallerana 28, 41030 Staggia (MO)', mittX + 4, cursorY + 14);
    doc.text('Tel. 329 97 80 703 · Fax 059 90 60 01', mittX + 4, cursorY + 19);
    doc.text('Mail: anguriadimodena@gmail.com', mittX + 4, cursorY + 24);
    doc.text('P.IVA 03235970369 · Cod. Fisc. MRSNTN81A12E897H', mittX + 4, cursorY + 29);
    doc.text('Iscriz. B.N.D.O.O. n°059906001', mittX + 4, cursorY + 34);
    doc.setFontSize(10);
    doc.text('DOCUMENTO DI TRASPORTO (D.P.R. 472 del 14/08/96)', mittX + 4, cursorY + 44);
    doc.setFontSize(14);
    doc.text(`${bolla.numeroBolla}`, mittX + mittW - 12, cursorY + 48);

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
    doc.setFontSize(12);
    doc.text(`Data: ${new Date(bolla.dataOra).toLocaleString()}`, destX + 4, cursorY + 53);

    // INDIRIZZO DESTINAZIONE & SEDE
    cursorY += 60;
    doc.setFontSize(10);
    doc.rect(M, cursorY, 95, 8);
    doc.rect(M + 95, cursorY, 95, 8);
    doc.text('Indirizzo destinazione:', M + 2, cursorY + 6);
    doc.text(bolla.indirizzoDestinazione, M + 2, cursorY + 16);
    doc.text('Sede azienda destinataria:', M + 97, cursorY + 6);

    // CAUSALE / VENDITA
    cursorY += 16;
    doc.rect(M, cursorY, 95, 8);
    doc.rect(M + 95, cursorY, 95, 8);
    doc.text('Causale del trasporto:', M + 2, cursorY + 6);
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
      headStyles: { fillColor: [200, 230, 200] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 25 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
      }
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
      head: [[
        'Tipologia','Valore','In Vs giacenza','Da trasporto attuale','Totali a rendere'
      ]],
      body: imballaggiData.map(r => [
        r.tipo, r.valore, r.inGiacenza, r.daTrasporto, r.daRendere
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [250, 240, 200] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      }
    });
    const afterImbY = (doc as any).lastAutoTable.finalY || (afterTableY + 12);

    // BARRA RESTITUZIONE E NOTE
    const restY = afterImbY + 8;
    doc.rect(M, restY, 180, 20);
    doc.setFontSize(8);
    doc.text(`Tempo concesso per la restituzione degli imballaggi a rendere (in giorni): 15`, M + 2, restY + 6);
    doc.text(`Si ricorda che ... penale pari al valore degli imballaggi non resi.`, M + 2, restY + 11);
    doc.text(`Per contestazione di qualità ...`, M + 2, restY + 16);

    // FIRME
    const fY = restY + 30;
    doc.rect(M, fY, 60, 12);
    doc.text('Consegna a carico del:', M + 2, fY + 6);
    doc.text(bolla.consegnaACarico, M + 45, fY + 6);
    doc.rect(M + 65, fY, 60, 12);
    doc.text('Vettore:', M + 67, fY + 6);
    doc.text(bolla.vettore, M + 100, fY + 6);
    doc.text('Firma Conducente 1', M, fY + 22);
    doc.line(M, fY + 24, M + 50, fY + 24);
    doc.text('Firma Conducente 2', M + 60, fY + 22);
    doc.line(M + 60, fY + 24, M + 110, fY + 24);
    doc.text('Firma Destinatario', M + 115, fY + 22);
    doc.line(M + 115, fY + 24, M + 175, fY + 24);

    // Salva PDF
    doc.save(`bolla n. ${bolla.numeroBolla}.pdf`);
  }

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
          <IconButton onClick={() => handleDelete(params.row.id)}><DeleteIcon/></IconButton>
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

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={bolle}
          columns={columns}
          getRowId={row => row.id!}
          initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          pageSizeOptions={[5, 10]}
        />
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