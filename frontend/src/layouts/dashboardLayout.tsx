import { Outlet, useParams, Link } from 'react-router-dom';
import { AppBar, Box, Toolbar, Typography, Button, Stack } from '@mui/material';

export default function DashboardLayout() {
  const { companyId } = useParams();

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to={`/dashboard/${companyId}`}
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Dashboard - {companyId}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button color="inherit" component={Link} to={`/dashboard/${companyId}/clienti`}>Clienti</Button>
            <Button color="inherit" component={Link} to={`/dashboard/${companyId}/imballaggi`}>Imballaggi</Button>
            <Button color="inherit" component={Link} to={`/dashboard/${companyId}/bolle`}>Bolle</Button>
            <Button color="inherit" component={Link} to={`/dashboard/${companyId}/report`}>Report</Button>
            <Button color="inherit" component={Link} to={`/dashboard/${companyId}/impostazioni`}>Impostazioni</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box p={3}>
        <Outlet />
      </Box>
    </Box>
  );
}