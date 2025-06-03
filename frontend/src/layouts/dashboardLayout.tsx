import { Outlet, Link } from 'react-router-dom';
import { AppBar, Box, Toolbar, Typography, Button, Stack } from '@mui/material';
import InstallPWAButton from '../components/installPWAButton.tsx';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isLoggedIn, logout } from '../hooks/useAuth.ts';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function DashboardLayout() {
  //const { companyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) navigate('/login');
  }, [navigate]);

  return (
    <Box>
      <AppBar position="static" sx={{display: 'flex', alignItems: 'space-between', justifyContent: 'center'}}>
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
            <Button color="inherit" component={Link} to={`/dashboard/clienti`}>Clienti</Button>
            <Button color="inherit" component={Link} to={`/dashboard/imballaggi`}>Imballaggi</Button>
            <Button color="inherit" component={Link} to={`/dashboard/bolle`}>Bolle</Button>
            <Button color="inherit" component={Link} to={`/dashboard/report`}>Report</Button>
            <Button color="inherit" component={Link} to={`/dashboard/impostazioni`}>Impostazioni</Button>
            <InstallPWAButton />
            <Button variant="outlined" onClick={() => alert('Qui ci sarà il prompt di installazione')} sx={{color: '#fff'}}>
              Installa App (debug)
            </Button>
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