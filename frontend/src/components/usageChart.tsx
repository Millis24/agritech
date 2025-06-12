import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Bolla } from '../storage/bolleDB';

// Registra i componenti Chart.js necessari
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface UsageChartProps {
  bolle: Bolla[];
}

/**
 * Grafico per l'utilizzo di imballaggi e analisi delle causali.
 * - Barre: numero di collis per tipo di imballaggio.
 * - Pie: percentuale di bolle per causale.
 */
export default function UsageChart({ bolle }: UsageChartProps) {
  const theme = useTheme();

  // Raccogli numero collis per imballaggio
  const imballaggiMap: Record<string, number> = {};
  bolle.forEach(b => {
    JSON.parse(b.daTrasportare).forEach((i: any) => {
      imballaggiMap[i.nomeImballaggio] = (imballaggiMap[i.nomeImballaggio] || 0) + i.numeroColli;
    });
  });
  const impLabels = Object.keys(imballaggiMap);
  const impValues = impLabels.map(l => imballaggiMap[l]);

  // Raccogli conteggio bolle per causale
  const causaleMap: Record<string, number> = {};
  bolle.forEach(b => {
    causaleMap[b.causale] = (causaleMap[b.causale] || 0) + 1;
  });
  const causaleLabels = Object.keys(causaleMap);
  const causaleValues = causaleLabels.map(l => causaleMap[l]);

  return (
    <Box display="flex" gap={4} flexDirection={{ xs: 'column', md: 'row' }}>
      <Box flex={1}>
        <Typography variant="subtitle1" gutterBottom>
          Imballaggi (nr. collis)
        </Typography>
        <Bar
          options={{
            responsive: true,
            plugins: { legend: { display: false }, title: { display: false } }
          }}
          data={{
            labels: impLabels,
            datasets: [{ label: 'Colli', data: impValues, backgroundColor: theme.palette.primary.main }]
          }}
        />
      </Box>

      <Box flex={1}>
        <Typography variant="subtitle1" gutterBottom>
          Bolle per Causale
        </Typography>
        <Pie
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' as const } }
          }}
          data={{
            labels: causaleLabels,
            datasets: [{ data: causaleValues, backgroundColor: [
              theme.palette.success.main,
              theme.palette.error.main,
              theme.palette.info.main
            ] }]
          }}
        />
      </Box>
    </Box>
  );
}
