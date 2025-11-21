import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getTask } from '../api/tasks';
import type { Task } from '../api/types';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }
  return format(new Date(value), 'MMM dd, yyyy HH:mm');
};

export function TaskDetailPage() {
  const { taskId } = useParams({ from: '/tasks/$taskId' });
  const numericId = Number(taskId);

  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['task', numericId],
    queryFn: () => getTask(numericId),
    enabled: Number.isFinite(numericId),
  });

  const renderStatusBadge = (status: Task['status']) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'In Progress':
        return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`;
      case 'Done':
        return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
      default:
        return `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-8">
          <p className="text-muted-foreground">Loading task...</p>
        </main>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-8 space-y-4">
          <Button variant="outline" asChild>
            <Link to="/tasks">← Back to Tasks</Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Task not found</CardTitle>
              <CardDescription>The requested task could not be loaded.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-8 space-y-6">
        <Button variant="outline" asChild>
          <Link to="/tasks">← Back to Tasks</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>{task.title}</span>
              <span className={renderStatusBadge(task.status)}>{task.status}</span>
            </CardTitle>
            <CardDescription>Task ID #{task.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
              <p className="text-sm text-foreground">
                {task.description?.trim() || 'No description provided.'}
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Assignee</h3>
                <p className="text-sm">
                  {task.assignee_username
                    ? `${task.assignee_username} (${task.assignee_role})`
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Deadline</h3>
                <p className="text-sm">{formatDate(task.deadline)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Created</h3>
                <p className="text-sm">{formatDate(task.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Last Updated</h3>
                <p className="text-sm">{formatDate(task.updated_at)}</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

