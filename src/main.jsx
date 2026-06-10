import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyTheme } from './themes.js';
import './styles.css';

applyTheme('focus'); // ensure vars exist before paint
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
