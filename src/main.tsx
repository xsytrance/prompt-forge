import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 1800 }} />
  </HashRouter>,
)
