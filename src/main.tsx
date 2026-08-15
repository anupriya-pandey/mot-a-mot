import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ProgressProvider } from './contexts/ProgressContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
