import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';

export default function Home() {
  //const { companyId } = useParams();

  return (
    <div>
      <Typography variant="h4">Benvenuto, ****!</Typography>
      <Typography variant="body1" mt={2}>
        Questa è la tua dashboard.
      </Typography>
    </div>
  );
}