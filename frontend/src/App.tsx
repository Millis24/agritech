// src/App.tsx
import { useRoutes } from 'react-router-dom';
import { routes } from './routes/index.tsx';
import './App.scss';

export default function App() {
  const routing = useRoutes(routes);
  return routing;
}