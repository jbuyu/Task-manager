import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import './index.css';

// Create React Query client with persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus to preserve session
      retry: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  },
});

// Restore auth state from cache on page load if available
const cachedAuth = queryClient.getQueryData<{ user: any }>(['auth', 'me']);
if (!cachedAuth) {
  // Set initial state to avoid immediate redirect
  queryClient.setQueryData(['auth', 'me'], { user: null });
}

// Update router context with query client
router.update({
  context: {
    queryClient,
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
