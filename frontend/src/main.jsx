import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { DataRefreshProvider } from './context/DataRefreshContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataRefreshProvider>
      <App />
    </DataRefreshProvider>
  </React.StrictMode>,
);
