import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { authMe } from './api/auth';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';

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

// Index route - redirect to dashboard if authenticated, login if not
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context, location }) => {
    const authData = context.queryClient.getQueryData<{ user: any }>(['auth', 'me']);
    if (authData?.user) {
      throw redirect({ to: '/dashboard', search: location.search });
    }
    throw redirect({ to: '/login', search: location.search });
  },
});

// Login route - redirect to dashboard if already authenticated
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: ({ context, location }) => {
    const authData = context.queryClient.getQueryData<{ user: any }>(['auth', 'me']);
    if (authData?.user) {
      throw redirect({ to: '/dashboard', search: location.search });
    }
  },
});

// Dashboard route - require authentication
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
  beforeLoad: ({ context, location }) => {
    const authData = context.queryClient.getQueryData<{ user: any }>(['auth', 'me']);
    if (!authData?.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
});

// Create route tree
const routeTree = rootRoute.addChildren([indexRoute, loginRoute, dashboardRoute]);

// Create router
export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined! as QueryClient,
  },
});
