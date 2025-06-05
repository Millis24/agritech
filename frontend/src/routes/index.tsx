import type { RouteObject } from 'react-router-dom';
import Login from '../pages/auth/login.tsx';
import DashboardLayout from '../layouts/dashboardLayout.tsx';
import Home from '../pages/dashboard/home.tsx';
import Clienti from '../pages/dashboard/clienti.tsx';
import Imballaggi from '../pages/dashboard/imballaggi.tsx';
import Prodotti from '../pages/dashboard/prodotti.tsx';

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
      { path: 'bolle', element: <div>Bolle</div> },
      { path: 'report', element: <div>Report</div> },
      { path: 'impostazioni', element: <div>Impostazioni</div> },

    ]
  },
  {
    path: '*',
    element: <Login />
  }
];