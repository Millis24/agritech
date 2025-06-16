// src/pages/dashboard/home.tsx
import { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllBolle } from '../../storage/bolleDB';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const MONTH_LABELS = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];
const COLORS = [
  '#4C57E5', '#E54C57', '#57E54C', '#E5D34C', '#4CE5D3',
  '#A14CE5', '#E54C4C', '#4CE58F', '#E58F4C', '#8FE54C'
];

export default function Home() {
  const [username, setUsername] = useState<string>('');
  const [chartData, setChartData] = useState<Array<{ month: string } & Record<string, number>>>([]);
  const [productList, setProductList] = useState<string[]>([]);

  const reloadData = async () => {
    const bolle = await getAllBolle();
    const products = new Set<string>();
    bolle.forEach(b =>
      JSON.parse(b.prodotti).forEach((p: any) => products.add(p.nomeProdotto))
    );
    const prodArray = Array.from(products);
    setProductList(prodArray);
    const data = MONTH_LABELS.map(m => {
      const obj: any = { month: m };
      prodArray.forEach(p => (obj[p] = 0));
      return obj;
    });
    bolle.forEach(b => {
      const monthIdx = new Date(b.dataOra).getMonth();
      const row = data[monthIdx];
      JSON.parse(b.prodotti).forEach((p: any) => {
        row[p.nomeProdotto] += p.totKgSpediti;
      });
    });
    setChartData(data);
  };

  useEffect(() => {
    // load user profile
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/user/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setUsername(profile.nomeUtente);
        } else {
          setUsername('utente');
        }
      } catch {
        setUsername('utente');
      }
    })();

    // initial load
    reloadData();
    // reload on window focus
    window.addEventListener('focus', reloadData);
    return () => window.removeEventListener('focus', reloadData);
  }, []);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom sx={{ flexGrow: 1 }}>
          Benvenuto, {username}!
        </Typography>
        <IconButton onClick={reloadData} size="large">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Typography variant="h6" mt={4}>
        Vendite per Prodotto (kg totali anno)
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {productList.map((prod, i) => (
              <Bar
                key={prod}
                dataKey={prod}
                name={prod}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}