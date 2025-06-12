import type { RouteObject } from 'react-router-dom';
import Login from '../pages/auth/login.tsx';
import DashboardLayout from '../layouts/dashboardLayout.tsx';
import Home from '../pages/dashboard/home.tsx';
import Clienti from '../pages/dashboard/clienti.tsx';
import Imballaggi from '../pages/dashboard/imballaggi.tsx';
import Prodotti from '../pages/dashboard/prodotti.tsx';
import Bolle from '../pages/dashboard/bolle.tsx';
import Report from '../pages/dashboard/report.tsx';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'clienti', element: <Clienti /> },
      { path: 'prodotti', element: <Prodotti /> },
      { path: 'imballaggi', element: <Imballaggi /> },
      { path: 'bolle', element: <Bolle /> },
      { path: 'report', element: <Report/> },
      { path: 'impostazioni', element: <div>Impostazioni</div> },

    ]
  },
  {
    path: '*',
    element: <Login />
  }
];