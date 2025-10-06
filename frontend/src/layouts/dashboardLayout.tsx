import { Outlet, Link } from 'react-router-dom';
import { AppBar, Box, Toolbar, Typography, Stack } from '@mui/material';
//import InstallPWAButton from '../components/installPWAButton.tsx';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isLoggedIn, logout } from '../hooks/useAuth.ts';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import useBolleSync from '../sync/useBolleSync.ts';

export default function DashboardLayout() {
  //const { companyId } = useParams();
  const navigate = useNavigate();

  useBolleSync();

  useEffect(() => {
    if (!isLoggedIn()) navigate('/login');
  }, [navigate]);

  return (
    <Box>
      <AppBar position="static" sx={{display: 'flex', alignItems: 'space-between', justifyContent: 'center', }}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to={`/dashboard`}
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            <AgricultureIcon sx={{ fontSize: 40 }}/>
          </Typography>
          <Stack direction="row" spacing={2}>
            <a href="/dashboard/clienti" style={{ color: 'inherit', textDecoration: 'none' }}>Clienti</a>
            <a href="/dashboard/prodotti" style={{ color: 'inherit', textDecoration: 'none' }}>Prodotti</a>
            <a href="/dashboard/imballaggi" style={{ color: 'inherit', textDecoration: 'none' }}>Imballaggi</a>
            <a href="/dashboard/bolle" style={{ color: 'inherit', textDecoration: 'none' }}>Bolle</a>
            <a href="/dashboard/report" style={{ color: 'inherit', textDecoration: 'none' }}>Report</a>
            <a href="/dashboard/logistica" style={{ color: 'inherit', textDecoration: 'none' }}>Logistica</a>
            <a href="/dashboard/impostazioni" style={{ color: 'inherit', textDecoration: 'none' }}>Impostazioni</a>
            {/* <InstallPWAButton /> */}
            {/* <Button variant="outlined" onClick={() => alert('Qui ci sarà il prompt di installazione')} sx={{color: '#fff'}}>
              Installa App (debug)
            </Button> */}
            <ExitToAppIcon onClick={logout} sx={{ fontSize: 30 }}/>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box p={3}>
        <Outlet />
      </Box>
    </Box>
  );
}