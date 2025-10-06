// File: src/pages/dashboard/report.tsx
import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Stack, Button, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { getAllBolle, type Bolla } from '../../storage/bolleDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';

const BAR_COLORS = ['#FF1744', '#00E676', '#2979FF', '#FFD600', '#FF6D00', '#D500F9', '#00E5FF', '#76FF03', '#FF3D00', '#18FFFF', '#EEFF41', '#FF4081'];

export default function ReportPage() {
  // Caricamento dati
  const [bolle, setBolle] = useState<Bolla[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);

  useEffect(() => {
    const load = async () => {
      const [allBolle, allClienti] = await Promise.all([
        getAllBolle(),
        getAllClienti(),
      ]);
      setBolle(allBolle);
      setClienti(allClienti);
    };
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  // --- Grafico 1: Angurie/Imballaggi per cliente ---
  const [fromProd, setFromProd] = useState('');
  const [toProd, setToProd] = useState('');
  const [selClienteProd, setSelClienteProd] = useState('');
  const [selCausaleProd, setSelCausaleProd] = useState('');
  const [viewMode, setViewMode] = useState<'angurie' | 'imballaggi'>('angurie');

  const filteredProd = useMemo(() => {
    const fromDate = fromProd ? new Date(fromProd) : null;
    const toDate = toProd ? new Date(toProd) : null;
    if (toDate) toDate.setHours(23,59,59,999);
    return bolle.filter(b => {
      if (selClienteProd && b.destinatarioNome !== selClienteProd) return false;
      if (selCausaleProd && b.causale !== selCausaleProd) return false;
      const d = new Date(b.dataOra);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [bolle, fromProd, toProd, selClienteProd, selCausaleProd]);

  const dataProd = useMemo(() => {
    if (viewMode === 'angurie') {
      // Mostra tutti i prodotti (aggregati per grafico)
      const prodMap: Record<string, number> = {};
      filteredProd.forEach(b => {
        if (b.numeroBolla?.toString().includes('/generica')) return;
        try {
          const list = JSON.parse(b.prodotti) as Array<{ nomeProdotto: string; pesoNetto: number; numeroColli: number }>;
          list.forEach(p => {
            prodMap[p.nomeProdotto] = (prodMap[p.nomeProdotto] || 0) + p.numeroColli;
          });
        } catch (e) {
          console.warn('Errore parsing prodotti per bolla', b.id, e);
        }
      });
      return Object.entries(prodMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, kg]) => ({ name, kg }));
    } else {
      // Mostra imballaggi (aggregati per grafico)
      const imMap: Record<string, number> = {};
      filteredProd.forEach(b => {
        if (!b.numeroBolla?.toString().includes('/generica') && b.daTrasportare) {
          try {
            (JSON.parse(b.daTrasportare) as Array<{ nomeImballaggio: string; numeroColli: number }>).forEach(i => {
              imMap[i.nomeImballaggio] = (imMap[i.nomeImballaggio] || 0) + i.numeroColli;
            });
          } catch (e) {
            console.warn('Errore parsing daTrasportare, bolla', b.id, e);
          }
        }
      });
      return Object.entries(imMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, kg]) => ({ name, kg }));
    }
  }, [filteredProd, viewMode]);

  // Dati dettagliati per la tabella (con data)
  const dataProdDetailed = useMemo(() => {
    const detailed: Array<{ name: string; data: string; kg: number }> = [];
    if (viewMode === 'angurie') {
      filteredProd.forEach(b => {
        if (b.numeroBolla?.toString().includes('/generica')) return;
        try {
          const list = JSON.parse(b.prodotti) as Array<{ nomeProdotto: string; pesoNetto: number; numeroColli: number }>;
          list.forEach(p => {
            detailed.push({
              name: p.nomeProdotto,
              data: new Date(b.dataOra).toLocaleDateString('it-IT'),
              kg: p.numeroColli
            });
          });
        } catch (e) {
          console.warn('Errore parsing prodotti per bolla', b.id, e);
        }
      });
    } else {
      filteredProd.forEach(b => {
        if (!b.numeroBolla?.toString().includes('/generica') && b.daTrasportare) {
          try {
            (JSON.parse(b.daTrasportare) as Array<{ nomeImballaggio: string; numeroColli: number }>).forEach(i => {
              detailed.push({
                name: i.nomeImballaggio,
                data: new Date(b.dataOra).toLocaleDateString('it-IT'),
                kg: i.numeroColli
              });
            });
          } catch (e) {
            console.warn('Errore parsing daTrasportare, bolla', b.id, e);
          }
        }
      });
    }
    return detailed.sort((a, b) => {
      const dateCompare = b.data.localeCompare(a.data);
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }, [filteredProd, viewMode]);

  // Estrae le causali uniche dalle bolle
  const causaliDisponibili = useMemo(() => {
    const causaliSet = new Set<string>();
    bolle.forEach(b => {
      if (b.causale) causaliSet.add(b.causale);
    });
    return Array.from(causaliSet).sort();
  }, [bolle]);

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2} sx={{fontWeight: 'bold'}}>Report Vendite</Typography>

      {/* Grafico 1: FILTRI */}
      <Typography variant="h6" gutterBottom>{viewMode === 'angurie' ? 'Prodotti per Cliente' : 'Imballaggi per Cliente'}</Typography>
      <Stack direction="row" spacing={2} mb={2} mt={4} flexWrap="wrap" alignItems="center">
        <TextField
          className='input-tondi'
          select
          label="Cliente"
          value={selClienteProd}
          onChange={e => setSelClienteProd(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tutti i clienti</MenuItem>
          {clienti.map(c => (
            <MenuItem key={c.id} value={c.nomeCliente}>{c.nomeCliente}</MenuItem>
          ))}
        </TextField>
        <TextField
          className='input-tondi'
          select
          label="Causale"
          value={selCausaleProd}
          onChange={e => setSelCausaleProd(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tutte le causali</MenuItem>
          {causaliDisponibili.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
        <TextField className='input-tondi' label="Da" type="date" value={fromProd} onChange={e => setFromProd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField className='input-tondi' label="A" type="date" value={toProd} onChange={e => setToProd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button
          className='input-tondi'
          variant={viewMode === 'angurie' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('angurie')}
        >
          Prodotti
        </Button>
        <Button
          className='input-tondi'
          variant={viewMode === 'imballaggi' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('imballaggi')}
        >
          Imballaggi
        </Button>
      </Stack>
      {/* Grafico 1 */}
      <Box height={300} mb={10} mt={8}>
        <ResponsiveContainer>
          <BarChart data={dataProd} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="kg" name={viewMode === 'angurie' ? 'Colli Prodotti' : 'Colli Imballaggi'}>
              {dataProd.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Tabella Kg */}
      <Typography variant="h6" gutterBottom mt={4}>{viewMode === 'angurie' ? 'Colli Prodotti' : 'Colli Imballaggi'} - spediti</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto', mb: 4, filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))', padding: '1em', borderRadius: '32px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>{viewMode === 'angurie' ? 'Prodotto' : 'Imballaggio'}</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell align="right"><strong>Colli</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataProdDetailed.map((row, index) => (
              <TableRow key={`${row.name}-${row.data}-${index}`}>
                <TableCell component="th" scope="row">{row.name}</TableCell>
                <TableCell>{row.data}</TableCell>
                <TableCell align="right">{row.kg}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}