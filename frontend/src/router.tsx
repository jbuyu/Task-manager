import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { authMe } from './api/auth';

// Root route with loader that fetches auth status
const rootRoute = createRootRoute({
  loader: async ({ context }) => {
    // Fetch current user on root load
    try {
      const data = await authMe();
      context.queryClient.setQueryData(['auth', 'me'], data);
      return data;
    } catch (error) {
      // 401 or other error - user not authenticated
      context.queryClient.setQueryData(['auth', 'me'], { user: null });
      return { user: null };
    }
  },
});

// Index route (will be replaced with dashboard/login later)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div style={{ padding: '20px' }}>
      <h1>Team Task Management</h1>
      <p>Loading...</p>
    </div>
  ),
});

// Create route tree
const routeTree = rootRoute.addChildren([indexRoute]);

// Create router
export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined! as QueryClient,
  },
});

