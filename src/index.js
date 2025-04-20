import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Caught unhandled promise rejection:', {
    reason: event.reason.message,
    stack: event.reason.stack,
    time: new Date().toISOString()
  });
  event.preventDefault(); // Suppress console error
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);