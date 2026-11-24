import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cinzel/latin-ext-700.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-ext-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-ext-400-italic.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/eb-garamond/latin-ext-600.css';
import './ui/theme/base.css';
import './ui/theme/layout.css';
import './ui/theme/card.css';
import './ui/theme/map.css';
import './ui/theme/dialogs.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
