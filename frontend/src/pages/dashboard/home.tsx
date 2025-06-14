// src/pages/dashboard/home.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import { getAllBolle } from '../../storage/bolleDB';
import { getAllClienti } from '../../storage/clientiDB';

export default function Home() {
  // Prendi username salvato in login
  const username = localStorage.getItem('username') || 'utente';

  // Stati per i KPI
  const [totalBolle, setTotalBolle] = useState(0);
  const [totalClienti, setTotalClienti] = useState(0);
  const [recentBolle, setRecentBolle] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const bolle = await getAllBolle();
      const clienti = await getAllClienti();
      setTotalBolle(bolle.length);
      setTotalClienti(clienti.length);
      // tieni solo le ultime 5 bolle ordinate per data
      const sorted = bolle
        .slice()
        .sort((a, b) => new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime());
      setRecentBolle(sorted.slice(0, 5));
    })();
  }, []);

  return (
    <Box>
      {/* Welcome */}
      <Typography variant="h4" gutterBottom>
        Benvenuto, {username}!
      </Typography>

      {/* KPI cards */}
      <Grid container spacing={2} mb={4}>
        <Grid sx={{ xs: 12, sm: 6,  md: 3}} >
          <Card>
            <CardContent>
              <Typography color="textSecondary">Totale Bolle</Typography>
              <Typography variant="h5">{totalBolle}</Typography>
              <Button size="small" sx={{ mt: 1 }} href="/dashboard/bolle">
                Vedi tutte
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12, sm: 6,  md: 3}}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Totale Clienti</Typography>
              <Typography variant="h5">{totalClienti}</Typography>
              <Button size="small" sx={{ mt: 1 }} href="/dashboard/clienti">
                Vedi tutti
              </Button>
            </CardContent>
          </Card>
        </Grid>
        {/* Qui puoi aggiungere altre card (Kg spediti oggi, Fatturato, ecc.) */}
      </Grid>

      {/* Bolle recenti */}
      <Box mb={2}>
        <Typography variant="h6">Ultime 5 Bolle</Typography>
        {recentBolle.length === 0 ? (
          <Typography color="textSecondary">Nessuna bolla ancora creata.</Typography>
        ) : (
          <Box component="ul" sx={{ pl: 2 }}>
            {recentBolle.map(b => {
              const kgTotali = JSON.parse(b.prodotti).reduce(
                (s: number, p: any) => s + p.totKgSpediti,
                0
              );
              return (
                <li key={b.id}>
                  <Typography>
                    Bolla n. {b.numeroBolla} —{' '}
                    {new Date(b.dataOra).toLocaleDateString('it-IT')} — {kgTotali} kg
                  </Typography>
                </li>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Quick actions */}
      <Box>
        <Typography variant="h6" mb={1}>
          Azioni rapide
        </Typography>
        <Grid container spacing={2}>
          <Grid>
            <Button variant="contained" href="/dashboard/bolle">
              + Nuova Bolla
            </Button>
          </Grid>
          <Grid>
            <Button variant="contained" href="/dashboard/clienti">
              + Nuovo Cliente
            </Button>
          </Grid>
          <Grid>
            <Button variant="outlined" href="/dashboard/impostazioni">
              Impostazioni
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}