import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { LanguageProvider } from './context/LanguageContext'
import { BrowserRouter, HashRouter } from 'react-router-dom'

// When running inside Electron / file:// protocol, HashRouter is required to prevent SecurityError and blank screens.
// In standard web browser (http/https), BrowserRouter provides standard clean URLs.
const isDesktopApp = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' || 
  navigator.userAgent.toLowerCase().includes('electron')
);
const Router = isDesktopApp ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  </React.StrictMode>,
)
