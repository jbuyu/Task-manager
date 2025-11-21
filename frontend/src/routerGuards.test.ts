import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { isRedirect } from '@tanstack/react-router';
import { redirectIfAuthenticated, requireAdmin, requireAuthentication } from './routerGuards';

const createContext = (user?: { role: string }) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['auth', 'me'], { user: user ?? null });
  const location = { href: '/dashboard', search: {} as Record<string, unknown> };
  return { queryClient, location };
};

describe('router guards', () => {
  it('redirects anonymous users to login', () => {
    const ctx = createContext();
    try {
      requireAuthentication(ctx);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
    }
  });

  it('allows authenticated users through', () => {
    const ctx = createContext({ role: 'Member' });
    expect(() => requireAuthentication(ctx)).not.toThrow();
  });

  it('prevents non-admins from accessing admin routes', () => {
    const ctx = createContext({ role: 'Manager' });
    try {
      requireAdmin(ctx);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
    }
  });

  it('allows admins through admin guard', () => {
    const ctx = createContext({ role: 'Admin' });
    expect(() => requireAdmin(ctx)).not.toThrow();
  });

  it('redirects authenticated users away from login', () => {
    const ctx = createContext({ role: 'Member' });
    try {
      redirectIfAuthenticated(ctx);
      throw new Error('Expected redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
    }
  });
});

