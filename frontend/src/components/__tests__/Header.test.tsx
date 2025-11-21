import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../Header';

const mockAuthMe = vi.fn();
const mockLogout = vi.fn();

vi.mock('../../api/auth', () => ({
  authMe: () => mockAuthMe(),
  logout: () => mockLogout(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, activeProps, ...props }: any) => (
      <a {...props}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
  };
});

const renderHeader = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Header />
    </QueryClientProvider>,
  );
};

describe('Header component', () => {
  beforeEach(() => {
    mockAuthMe.mockReset();
    mockLogout.mockReset();
  });

  it('shows Users nav link for admins', async () => {
    mockAuthMe.mockResolvedValue({ user: { username: 'admin', role: 'Admin', is_active: true } });
    await renderHeader();
    expect(await screen.findByText('Users')).toBeInTheDocument();
  });

  it('hides Users nav link for managers', async () => {
    mockAuthMe.mockResolvedValue({ user: { username: 'manager', role: 'Manager', is_active: true } });
    await renderHeader();
    expect(await screen.findByText('Tasks')).toBeInTheDocument();
    expect(screen.queryByText('Users')).toBeNull();
  });
});

