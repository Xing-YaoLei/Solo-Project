import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Tooltip from '@radix-ui/react-tooltip';
import App from './App';
import './index.css';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const QUERY_KEYS = {
  dashboardSummary: ['dashboard', 'summary'],
  syncDelay: ['sync', 'delay'],
  stores: ['stores'],
  storeMap: ['stores', 'geo'],
  alerts: ['alerts'],
  rules: ['rules'],
  thresholds: ['rules', 'thresholds'],
  riskMatrix: ['analytics', 'risk-matrix'],
  preparationTrend: ['analytics', 'preparation-trend'],
  testDriveDist: ['analytics', 'test-drive-distribution'],
  quoteCandles: ['analytics', 'quote-candles'],
  review: (vin: string) => ['review', vin] as const,
  vehicles: ['vehicles'],
} as const;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={150}>
        <App />
      </Tooltip.Provider>
    </QueryClientProvider>
  </StrictMode>
);
