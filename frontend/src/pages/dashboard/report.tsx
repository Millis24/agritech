// File: src/pages/dashboard/report.tsx
import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Stack, Button, TextField, MenuItem, FormControlLabel, Checkbox, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { saveAs } from 'file-saver';
import { getAllBolle, type Bolla } from '../../storage/bolleDB';
import { getAllClienti, type Cliente } from '../../storage/clientiDB';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#FFBB28', '#FF8042'];

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

  // --- Grafico 1: Generale per prodotto ---
  const [fromProd, setFromProd] = useState('');
  const [toProd, setToProd] = useState('');
  const [showCountProd, setShowCountProd] = useState(true);

  const filteredProd = useMemo(() => {
    const fromDate = fromProd ? new Date(fromProd) : null;
    const toDate = toProd ? new Date(toProd) : null;
    if (toDate) toDate.setHours(23,59,59,999);
    return bolle.filter(b => {
      const d = new Date(b.dataOra);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [bolle, fromProd, toProd]);

  const dataProd = useMemo(() => {
    const map: Record<string, { kg: number; count: number }> = {};
    filteredProd.forEach(b => {
      const list = JSON.parse(b.prodotti) as Array<{ nomeProdotto: string; totKgSpediti: number; numeroColli: number }>;
      list.forEach(p => {
        if (!map[p.nomeProdotto]) map[p.nomeProdotto] = { kg: 0, count: 0 };
        map[p.nomeProdotto].kg += p.numeroColli;
        map[p.nomeProdotto].count += 1;
      });
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, v]) => ({ name, kg: v.kg, count: v.count }));
  }, [filteredProd]);

  const exportProdDetailedCSV = () => {
    let csv = 'bollaId,dataOra,cliente,nomeProdotto,qualita,prezzo,numeroColli,totKgSpediti,nomeImballaggio,prezzoImballaggio\n';
    let totalKg = 0;
    filteredProd.forEach(b => {
      const prodottiList = JSON.parse(b.prodotti) as Array<any>;
      prodottiList.forEach(p => {
        csv += [
          b.id,
          `"${b.dataOra}"`,
          `"${b.destinatarioNome}"`,
          `"${p.nomeProdotto}"`,
          `"${p.qualita}"`,
          p.prezzo,
          p.numeroColli,
          p.totKgSpediti,
          `"${p.nomeImballaggio}"`,
          p.prezzoImballaggio
        ].join(',') + '\n';
        totalKg += p.numeroColli;
      });
    });
    // Append total line
    csv += `"Totale Kg spediti",,,, ,,, ,${totalKg}\n`;
    // Append summary table header
    csv += '\nProdotto,Kg Spediti\n';
    // Append per-product totals
    dataProd.forEach(row => {
      csv += `${row.name},${row.kg}\n`;
    });
    // Trigger download
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'prodotti_report_dettaglio.csv');
  };

  // --- Grafico 2: Prodotti per Cliente ---
  const [selCliente, setSelCliente] = useState('');
  const [fromClient, setFromClient] = useState('');
  const [toClient, setToClient] = useState('');

  const filteredClient = useMemo(() => {
    const fromDate = fromClient ? new Date(fromClient) : null;
    const toDate = toClient ? new Date(toClient) : null;
    if (toDate) toDate.setHours(23,59,59,999);
    return bolle.filter(b => {
      if (selCliente && b.destinatarioNome !== selCliente) return false;
      const d = new Date(b.dataOra);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [bolle, selCliente, fromClient, toClient]);

  const dataClient = useMemo(() => {
    if (!selCliente) return [];
    const map: Record<string, number> = {};
    filteredClient.forEach(b => {
      (JSON.parse(b.prodotti) as Array<{ nomeProdotto: string; totKgSpediti: number; numeroColli: number }> ).forEach(p => {
        map[p.nomeProdotto] = (map[p.nomeProdotto] || 0) + p.numeroColli;
      });
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, kg]) => ({ name, kg }));
  }, [filteredClient]);

  // --- Grafico 3: Imballaggi e Causali ---
  const [fromUse, setFromUse] = useState('');
  const [toUse, setToUse] = useState('');

  const filteredUse = useMemo(() => {
    const fromDate = fromUse ? new Date(fromUse) : null;
    const toDate = toUse ? new Date(toUse) : null;
    if (toDate) toDate.setHours(23,59,59,999);
    return bolle.filter(b => {
      const d = new Date(b.dataOra);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [bolle, fromUse, toUse]);

  const dataUse = useMemo(() => {
    const imMap: Record<string, number> = {};
    const cuMap: Record<string, number> = {};
    filteredUse.forEach(b => {
      (JSON.parse(b.daTrasportare) as Array<{ nomeImballaggio: string; numeroColli: number }> ).forEach(i => {
        imMap[i.nomeImballaggio] = (imMap[i.nomeImballaggio] || 0) + i.numeroColli;
      });
      cuMap[b.causale] = (cuMap[b.causale] || 0) + 1;
    });
    return {
      imballaggi: Object.entries(imMap).map(([name, value]) => ({ name, value })),
      causali:     Object.entries(cuMap).map(([name, value]) => ({ name, value })),
    };
  }, [filteredUse]);

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2} sx={{fontWeight: 'bold'}}>Report Vendite</Typography>

      {/* Grafico 1: FILTRI */}
      <Typography variant="h6" gutterBottom>Quantità per Prodotto</Typography>
      <Stack direction="row" spacing={2} mb={2} mt={4} flexWrap="wrap">
        <TextField className='input-tondi' label="Da" type="date" value={fromProd} onChange={e => setFromProd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField className='input-tondi' label="A" type="date" value={toProd} onChange={e => setToProd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControlLabel control={<Checkbox checked={showCountProd} onChange={e => setShowCountProd(e.target.checked)} />} label="Mostra N. bolle" />
        <Button className='input-tondi' variant="outlined" onClick={exportProdDetailedCSV}>Esporta CSV</Button>
      </Stack>
      {/* Grafico 1 */}
      <Box height={300} mb={10} mt={8}>
        <ResponsiveContainer>
          <BarChart data={dataProd} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            {/* asse dei Kg a sinistra */}
            <YAxis yAxisId="left" />
            {/* asse del conteggio a destra */}
            <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
            <Tooltip />
            <Legend />
            {/* barre Kg → asse sinistro */}
            <Bar yAxisId="left" dataKey="kg" fill="#8884d8" name="Kg spediti" />
            {/* barre Conteggio → asse destro */}
            {showCountProd && (
              <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Numero bolle" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Tabella Kg per Prodotto */}
      <Typography variant="h6" gutterBottom mt={4}>Colli Prodotti - spediti</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto', mb: 4, filter: 'drop-shadow(0px 5px 15px rgba(88, 102, 253, 0.25))', padding: '1em', borderRadius: '32px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Prodotto</strong></TableCell>
              <TableCell align="right"><strong>Colli</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataProd.map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">{row.name}</TableCell>
                <TableCell align="right">{row.kg}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Grafico 2: filtri */}
      <Typography variant="h6" gutterBottom mt={6}>Prodotti per Cliente</Typography>
      <Stack direction="row" spacing={2} mb={2} mt={4} flexWrap="wrap">
        <TextField className='input-tondi' select label="Cliente" value={selCliente} onChange={e => setSelCliente(e.target.value)} sx={{ minWidth: 200 }}>
          {clienti.map(c => (
            <MenuItem key={c.id} value={c.nomeCliente}>{c.nomeCliente}</MenuItem>
          ))}
        </TextField>
        <TextField className='input-tondi' label="Da" type="date" value={fromClient} onChange={e => setFromClient(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField className='input-tondi' label="A" type="date" value={toClient} onChange={e => setToClient(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>
      {/* Grafico 2 */}
      {selCliente && (
        <>
          {(() => {
            const CLIENT_COLORS = ['#8884d8', '#82ca9d', '#FFBB28', '#FF8042', '#A28FD0'];
            return (
              <Box height={250} mt={8}>
                <ResponsiveContainer>
                  <BarChart data={dataClient} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kg">
                      {dataClient.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CLIENT_COLORS[index % CLIENT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            );
          })()}
        </>
      )}

      {/* Grafico 3: filtri */}
      <Typography variant="h6" gutterBottom mt={10}>Imballaggi / Causali</Typography>
      <Stack direction="row" spacing={2} mb={2} mt={4} flexWrap="wrap">
        <TextField className='input-tondi' label="Da" type="date" value={fromUse} onChange={e => setFromUse(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField className='input-tondi' label="A" type="date" value={toUse} onChange={e => setToUse(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>
      {/* Grafico 3: imballaggi */}
      <Box display="flex" gap={4} flexWrap="wrap">
        <Box width="45%" height={250} mb={10} mt={8}>
          <Typography>Imballaggi (colli)</Typography>
          <ResponsiveContainer>
            <BarChart data={dataUse.imballaggi} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        {/* Grafico 3: causali */}
        <Box width="45%" height={250}  mb={10} mt={8}>
          <Typography>Causali</Typography>
          <ResponsiveContainer>
            <PieChart>
              <Legend verticalAlign="bottom" />
              <Pie data={dataUse.causali} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {dataUse.causali.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}