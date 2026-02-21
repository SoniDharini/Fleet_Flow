import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6' }, // Electric Blue
    secondary: { main: '#22D3EE' }, // Neon Cyan
    info: { main: '#8B5CF6' }, // Soft Purple
    success: { main: '#10B981' }, // Green
    warning: { main: '#F59E0B' }, // Yellow
    error: { main: '#EF4444' }, // Red
    background: { 
      default: '#0F172A',
      paper: 'rgba(30, 41, 59, 0.7)' // Glass effect base
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8'
    }
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          minHeight: '100vh',
          backgroundAttachment: 'fixed',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(148, 163, 184, 0.3)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(148, 163, 184, 0.5)',
        },
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)',
          }
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #3B82F6 0%, #22D3EE 100%)',
          border: 'none',
          color: '#fff',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }
      }
    }
  }
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
