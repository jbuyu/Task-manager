import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logout, authMe } from '../api/auth';

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get current user
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authMe,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear auth cache
      queryClient.setQueryData(['auth', 'me'], { user: null });
      // Redirect to login
      navigate({ to: '/login' });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  const user = authData?.user;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Team Task Management</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>
            Welcome, <strong>{user?.username}</strong> ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: logoutMutation.isPending ? 0.6 : 1
            }}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      <div>
        <h2>Dashboard</h2>
        <p>Welcome to the Team Task Management Dashboard</p>
        <p>This is a placeholder. Full dashboard will be implemented in next iterations.</p>
        
        {user && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h3>User Information</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><strong>Username:</strong> {user.username}</li>
              <li><strong>Email:</strong> {user.email || 'Not provided'}</li>
              <li><strong>Role:</strong> {user.role}</li>
              <li><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

