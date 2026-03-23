import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AppShell = () => (
  <Box
    component="main"
    sx={{
      minHeight: '100vh',
      px: { xs: 1.5, sm: 2, md: 3 },
      py: { xs: 1.5, sm: 2, md: 3 },
      width: '100%',
    }}
  >
    <Outlet />
  </Box>
);
