import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

// The native WKWebView serves dist/ statically with no SPA fallback, so a
// reload on a deep path like /accountability would 404; hash URLs avoid that.
const routedApp = Capacitor.isNativePlatform()
  ? <HashRouter><App /></HashRouter>
  : <BrowserRouter><App /></BrowserRouter>

createRoot(document.getElementById('root')).render(
  <StrictMode>{routedApp}</StrictMode>,
)
