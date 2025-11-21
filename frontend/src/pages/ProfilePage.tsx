import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { authMe } from '../api/auth';

export function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authMe,
  });

  const user = data?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-8">
          <p className="text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Review your account details and session settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your login details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Username</p>
                <p className="font-semibold">{user.username}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{user.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Role</p>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {user.role}
                </span>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    user.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Tips</CardTitle>
              <CardDescription>Keep your session protected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Use strong passwords and rotate them regularly.</p>
              <p>• Log out when you finish working on shared devices.</p>
              <p>• Contact an Admin if you need role or account changes.</p>
              <p>• Sessions expire automatically after 24 hours of inactivity.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

