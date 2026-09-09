import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { lockViewportZoom } from './lib/lockViewportZoom';
import './styles/index.css';

lockViewportZoom();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Brak elementu #root');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
