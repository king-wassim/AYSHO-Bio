import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CatalogProvider } from './store/CatalogContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CatalogProvider>
      <App />
    </CatalogProvider>
  </React.StrictMode>,
)
