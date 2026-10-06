import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthProvider';
import { ActiveFarmProvider } from './context/ActiveFarmProvider';
import { ToastProvider } from './components/ui/Toast';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveFarmProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ActiveFarmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
