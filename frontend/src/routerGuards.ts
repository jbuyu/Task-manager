import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';

interface GuardContext {
  queryClient: QueryClient;
  location: {
    href: string;
    search: Record<string, unknown>;
  };
}

export const redirectIfAuthenticated = ({ queryClient, location }: GuardContext) => {
  const authData = queryClient.getQueryData<{ user: any }>(['auth', 'me']);
  if (authData?.user) {
    throw redirect({ to: '/dashboard', search: location.search });
  }
};

export const requireAuthentication = ({ queryClient, location }: GuardContext) => {
  const authData = queryClient.getQueryData<{ user: any }>(['auth', 'me']);
  if (!authData?.user) {
    throw redirect({ to: '/login', search: { redirect: location.href } });
  }
};

export const requireAdmin = ({ queryClient, location }: GuardContext) => {
  requireAuthentication({ queryClient, location });
  const authData = queryClient.getQueryData<{ user: any }>(['auth', 'me']);
  if (authData?.user?.role !== 'Admin') {
    throw redirect({ to: '/dashboard' });
  }
};

