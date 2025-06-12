import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';

// registra solo i moduli di Chart.js che ti servono
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export type ReportDatum = {
  label: string;         // es. mese oppure nome cliente
  value1: number;        // es. kg spediti
  value2?: number;       // es. numero bolle o altro
};

interface ReportChartProps {
  data: ReportDatum[];
  type?: 'line' | 'bar';
  title?: string;
}

export default function ReportChart({
  data,
  type = 'line',
  title = ''
}: ReportChartProps) {
  const theme = useTheme();

  const labels = data.map(d => d.label);
  const dataset1 = data.map(d => d.value1);
  const dataset2 = data.map(d => d.value2 ?? 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Kg spediti',
        data: dataset1,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,  // curva morbida per line
      },
      ...(type === 'line'
        ? [{
            label: 'N. bolle',
            data: dataset2,
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.secondary.light,
            tension: 0.4,
          }]
        : [])
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: theme.palette.text.primary } },
      title: { display: !!title, text: title, color: theme.palette.text.primary },
      tooltip: { mode: 'index' as const, intersect: false as const },
    },
    scales: {
      x: { ticks: { color: theme.palette.text.secondary } },
      y: { ticks: { color: theme.palette.text.secondary } }
    }
  };

  return type === 'bar' ? (
    <Bar options={options} data={chartData} />
  ) : (
    <Line options={options} data={chartData} />
  );
}