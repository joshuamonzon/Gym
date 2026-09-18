import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { db, ensureSeeds } from './db/db'
import { setupServiceWorker } from './pwa/registerSW'
import './index.css'

ensureSeeds(db).catch((err) => console.error('seed failed', err))
setupServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
