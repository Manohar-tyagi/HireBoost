import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';

export const App: React.FC = () => {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F9FAFB',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#111827' },
            duration: 3000,
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#111827' },
            duration: 4000,
          },
          loading: {
            style: {
              background: '#111827',
              border: '1px solid rgba(79, 142, 247, 0.3)',
              color: '#F9FAFB',
            },
          },
        }}
      />
      <Dashboard />
    </>
  );
};

export default App;
