import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3b82f6',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
