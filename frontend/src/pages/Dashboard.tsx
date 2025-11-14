import { useQuery } from '@tanstack/react-query';
import { authMe } from '../api/auth';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Dashboard() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authMe,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const user = authData?.user;

  if (!user) {
    return null;
  }

  const roleBadgeColor = {
    Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    Member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }[user.role] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back, {user.username}! Here's an overview of your tasks.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-base font-semibold">{user.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{user.email || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${roleBadgeColor}`}>
                    {user.role}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base">
                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Task overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Task statistics will appear here once tasks are implemented.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Recent activity will appear here once tasks are implemented.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>What you can do next</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>View and manage your assigned tasks</li>
                <li>Create new tasks (Manager and Admin only)</li>
                <li>Update task status and deadlines</li>
                <li>Filter tasks by status or assignee</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
