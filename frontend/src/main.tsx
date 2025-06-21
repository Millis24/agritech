import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import './App.css'
//import { SettingsProvider } from './contexts/settingsContext';

if (import.meta.env.VITE_API_BASE_URL?.includes('localhost')) {
  console.warn('⚠️ Stai usando localhost come base API URL in produzione!');
}

registerSW();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* <SettingsProvider>
        <App />
      </SettingsProvider> */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);