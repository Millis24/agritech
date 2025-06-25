// File: src/components/Layout.tsx
import React from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Box, Divider, useTheme, } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import Description from '@mui/icons-material/Description';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { logout } from '../hooks/useAuth';
import logoAgritech from '../assets/logo-agritech-bianco.png';
import '../App.scss';


const drawerWidth = 240;

const navItems = [
  { text: 'Bolle', icon: <Description />, path: '/dashboard/bolle' },
  { text: 'Clienti', icon: <PeopleIcon />, path: '/dashboard/clienti' },
  { text: 'Prodotti', icon: <InventoryIcon />, path: '/dashboard/prodotti' },
  { text: 'Imballaggi', icon: <LocalShippingIcon />, path: '/dashboard/imballaggi' },
  { text: 'Report', icon: <AssessmentIcon />, path: '/dashboard/report' },
  { text: 'Impostazioni', icon: <SettingsIcon />, path: '/dashboard/impostazioni' },
];

export default function Layout() {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/dashboard"
          sx={{ textDecoration: 'none', color: 'inherit'}}
        >
          <Box
            component="img"
            src={logoAgritech}
            alt="CRM AgriTech"
            onClick={() => navigate('/dashboard')}
            sx={{
              height: 100,
              width: 'auto',
              cursor: 'pointer',
              mr: 2
            }}
          />
        </Typography>
        
      </Toolbar>
      <Divider />
      <List>
        {navItems.map(({ text, icon, path }) => (
          <ListItemButton
            key={text}
            component="a"
            href={path}
            selected={location.pathname.startsWith(path)}
          >
            <ListItemIcon sx={{ color: 'inherit', backgroundColor: '#8a92ff', display: 'flex', justifyContent: 'center', padding: '.5em', borderRadius: '11px', minWidth: 'auto', marginRight: '1em', boxShadow: '0px 4px 10px 0px #00000045' }}>
              {icon}
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Esci" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#fff',  
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#4C57E5' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation drawers"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#4C57E5',
              color: '#fff'
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#4C57E5',
              color: '#fff'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}