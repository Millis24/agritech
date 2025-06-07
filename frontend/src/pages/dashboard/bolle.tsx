import { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';

import AddBollaDialog from '../../components/addBollaDialog';
import useBolleSync from '../../sync/useBolleSync';

import jsPDF from 'jspdf';

import {
  getAllBolle,
  saveBolla,
  deleteBolla as deleteLocalBolla,
  type Bolla
} from '../../storage/bolleDB';
import { markBollaAsDeleted } from '../../storage/bolleEliminateDB';

import { getAllClienti, type Cliente } from '../../storage/clientiDB';
import { getAllProdotti, type Prodotto } from '../../storage/prodottiDB';
import { getAllImballaggi, type Imballaggio } from '../../storage/imballaggiDB';

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

    setBolle(bolleData);
    setClienti(clientiData);
    setProdotti(prodottiData);
    setImballaggi(imballaggiData);
  };

  useEffect(() => {
    const fetchData = async () => {
      await ricaricaDati();
      setLoading(false);
    };

    fetchData();
  }, []);

  useBolleSync();

  const handleDelete = async (id: number) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(`http://localhost:4000/api/bolle/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await deleteLocalBolla(id);
          alert('✅ Bolla eliminata online');
        } else {
          alert('❌ Errore nella cancellazione online');
        }
      } catch (error) {
        alert('❌ Errore di rete');
      }
    } else {
      await markBollaAsDeleted(id);
      alert('⚠️ Eliminato offline, sarà sincronizzato');
    }
    await ricaricaDati(); // aggiorna la tabella
  };

  const handlePrint = (bolla: Bolla) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bolla n. ${bolla.numeroBolla}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${new Date(bolla.dataOra).toLocaleString()}`, 10, 30);
    doc.text(`Destinatario: ${bolla.destinatarioNome}`, 10, 40);
    doc.text(`Indirizzo: ${bolla.destinatarioIndirizzo}`, 10, 50);
    doc.text(`Causale: ${bolla.causale}`, 10, 60);
    doc.text(`Prodotti:`, 10, 70);

    let y = 80;
    try {
      const prodotti = JSON.parse(bolla.prodotti);
      prodotti.forEach((p: any) => {
        doc.text(`• ${p.nomeProdotto}, Colli: ${p.numeroColli}, Kg: ${p.totKgSpediti}`, 12, y);
        y += 10;
      });
    } catch (e) {
      doc.text('Errore lettura prodotti.', 10, y);
    }

    doc.save(`bolla-${bolla.numeroBolla}.pdf`);
  };

  const columns: GridColDef[] = [
    { field: 'numeroBolla', headerName: 'Numero', width: 100 },
    { field: 'dataOra', headerName: 'Data', width: 150 },
    {
      field: 'destinatarioNome',
      headerName: 'Destinatario',
      width: 200
    },
    { field: 'indirizzoDestinazione', headerName: 'Indirizzo di Destinazione', width: 250 },
    { field: 'causale', headerName: 'Causale', width: 150 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => {
            setEditing(params.row);
            setOpen(true);
          }}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={() => handlePrint(params.row)}>
            <PrintIcon/>
          </IconButton>
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
            setEditing(null);
            setOpen(true);
          } else {
            alert("⏳ Attendi il caricamento dei dati prima di aggiungere una bolla.");
          }
        }}>
          Aggiungi Bolla
        </Button>
      </Box>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={bolle}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
          pageSizeOptions={[5, 10]}
        />
      </div>

      <AddBollaDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        bolla={editing || null}
        onSave={async (bolla) => {
          if (navigator.onLine) {
            try {
              const res = await fetch('http://localhost:4000/api/bolle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bolla),
              });

              if (res.ok) {
                const nuovaBolla = await res.json();
                await saveBolla({ ...nuovaBolla, synced: true });
                console.log('✅ Bolla salvata online e localmente');
              } else {
                console.error('❌ Errore salvataggio online:', await res.text());
                // fallback: salva offline
                await saveBolla({ ...bolla, synced: false });
              }
            } catch (err) {
              console.error('❌ Errore rete durante POST:', err);
              await saveBolla({ ...bolla, synced: false });
            }
          } else {
            // Offline: salva in IndexedDB
            await saveBolla({ ...bolla, synced: false });
            console.log('📴 Bolla salvata offline');
          }

          await ricaricaDati();
          setOpen(false);
        }}
        clienti={clienti}
        prodotti={prodotti}
        imballaggi={imballaggi}
        numeroBolla={bolle.length > 0 ? Math.max(...bolle.map(b => b.numeroBolla)) + 1 : 1}
      />
    </Box>
  );
}