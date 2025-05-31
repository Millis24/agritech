import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function Login() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const handleLogin = () => {
    // finta login
    navigate(`/dashboard/${companyId}`);
  };

  return (
    <Box textAlign="center" mt={10}>
      <Typography variant="h4" gutterBottom>
        Login - {companyId}
      </Typography>
      <Button variant="contained" onClick={handleLogin}>
        Entra
      </Button>
    </Box>
  );
}