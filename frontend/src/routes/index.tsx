import type { RouteObject } from 'react-router-dom';
import Login from '../pages/auth/login.tsx';
import Layout from '../layouts/layout.tsx';
import Home from '../pages/dashboard/home.tsx';
import Clienti from '../pages/dashboard/clienti.tsx';
import Imballaggi from '../pages/dashboard/imballaggi.tsx';
import Prodotti from '../pages/dashboard/prodotti.tsx';
import Bolle from '../pages/dashboard/bolle.tsx';
import Report from '../pages/dashboard/report.tsx';
import Impostazioni from '../pages/dashboard/impostazioni.tsx';
import Logistica from '../pages/dashboard/logistica.tsx';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'clienti', element: <Clienti /> },
      { path: 'prodotti', element: <Prodotti /> },
      { path: 'imballaggi', element: <Imballaggi /> },
      { path: 'bolle', element: <Bolle /> },
      { path: 'report', element: <Report/> },
      { path: 'logistica', element: <Logistica/> },
      { path: 'impostazioni', element: <Impostazioni/> },

    ]
  },
  {
    path: '*',
    element: <Login />
  }
];