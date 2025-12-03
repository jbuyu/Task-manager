import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { authMe } from './api/auth';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { UsersPage } from './pages/UsersPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { redirectIfAuthenticated, requireAdmin, requireAuthentication } from './routerGuards';

// Root route with loader that fetches auth status
const rootRoute = createRootRoute({
  loader: async ({ context }) => {
    // Check if we have cached auth data first
    const cachedAuth = context.queryClient.getQueryData<{ user: any }>(['auth', 'me']);
    
    // Only fetch if we don't have cached data or if it's stale
    if (!cachedAuth) {
      try {
        const data = await authMe();
        context.queryClient.setQueryData(['auth', 'me'], data);
        return data;
      } catch (error: any) {
        // Only clear auth on 401 (unauthorized), not on network errors
        if (error?.response?.status === 401) {
          context.queryClient.setQueryData(['auth', 'me'], { user: null });
          return { user: null };
        }
        // For other errors (network, etc.), return null auth
        context.queryClient.setQueryData(['auth', 'me'], { user: null });
        return { user: null };
      }
    }
    
    // Return cached auth data
    return cachedAuth;
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
    redirectIfAuthenticated({ queryClient: context.queryClient, location });
  },
});

// Dashboard route - require authentication
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
  beforeLoad: ({ context, location }) => {
    requireAuthentication({ queryClient: context.queryClient, location });
  },
});

// Tasks route - require authentication
const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TasksPage,
  beforeLoad: ({ context, location }) => {
    requireAuthentication({ queryClient: context.queryClient, location });
  },
});

// Task detail route - require authentication
const taskDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/$taskId',
  component: TaskDetailPage,
  beforeLoad: ({ context, location }) => {
    requireAuthentication({ queryClient: context.queryClient, location });
  },
});

// Profile route - require authentication
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
  beforeLoad: ({ context, location }) => {
    requireAuthentication({ queryClient: context.queryClient, location });
  },
});

// Users route - require Admin role
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: ({ context, location }) => {
    requireAdmin({ queryClient: context.queryClient, location });
  },
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  tasksRoute,
  taskDetailRoute,
  profileRoute,
  usersRoute,
]);

// Create router
export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined! as QueryClient,
  },
});
