import React from 'react';
import ReactDOM from 'react-dom/client';
import JSZip from 'jszip';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// Ensure JSZip is globally accessible for epub.js UMD runtime across both dev and production
if (typeof window !== 'undefined') {
  (window as unknown as { JSZip: typeof JSZip }).JSZip = JSZip;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
