import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green 800
      light: '#4caf50', // Green 500
      dark: '#1b5e20', // Green 900
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8bc34a', // Light Green 500
      light: '#c5e1a5', // Light Green 200
      dark: '#558b2f', // Light Green 800
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fbf7', // Very light green/white
      paper: '#ffffff',
    },
    text: {
      primary: '#263238', // Blue Grey 900
      secondary: '#546e7a', // Blue Grey 600
    },
    error: {
      main: '#d32f2f', // Red 700
    },
    warning: {
      main: '#ff9800', // Orange 500
    },
    info: {
      main: '#0288d1', // Light Blue 700
    },
    success: {
      main: '#388e3c', // Green 700
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1b5e20', // Green 900
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
        },
      },
    },
  },
});

export default theme; 