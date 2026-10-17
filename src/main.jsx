import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
      <StrictMode>
        <App />
         <Toaster />
      </StrictMode>
  </HelmetProvider>
)