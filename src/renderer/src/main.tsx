import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme.css';
import './performance.css';
import './windows.css';
import './wallpaper.css';

if (navigator.platform.toLowerCase().startsWith('win')) {
  document.documentElement.dataset.platform = 'windows';
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
