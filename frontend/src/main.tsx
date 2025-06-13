import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import './App.css'
//import { SettingsProvider } from './contexts/settingsContext';

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