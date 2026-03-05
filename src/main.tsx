import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { IdsProvider } from '@instacart/ids-core'
import { TdsProvider } from '@instacart/tds'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <IdsProvider>
        <TdsProvider>
          <App />
        </TdsProvider>
      </IdsProvider>
    </MantineProvider>
  </StrictMode>,
)
