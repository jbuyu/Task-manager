import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '../api/types';
import { authMe } from '../api/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../components/ui/dialog';
import { TaskForm } from '../components/TaskForm';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getUserChoices } from '../api/users';
import type { UserChoice } from '../api/users';

export function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authMe,
  });

  const user = authData?.user;

  const { data: userChoices = [] } = useQuery<UserChoice[]>({
    queryKey: ['user-choices'],
    queryFn: getUserChoices,
    enabled: user?.role === 'Admin' || user?.role === 'Manager',
    staleTime: 5 * 60 * 1000,
  });

  const assigneeParam =
    assigneeFilter === 'mine'
      ? user?.id
      : assigneeFilter
        ? Number(assigneeFilter)
        : undefined;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', statusFilter, searchQuery, assigneeFilter],
    queryFn: () =>
      getTasks({
        status: statusFilter as Task['status'] | undefined,
        search: searchQuery || undefined,
        assignee: assigneeParam,
      }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskCreateRequest }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const canCreate = user?.role === 'Admin' || user?.role === 'Manager';
  const canEdit = (task: Task) =>
    user?.role === 'Admin' || user?.role === 'Manager' || task.assignee === user?.id;
  const canDelete = user?.role === 'Admin';

  const handleCreate = (data: TaskCreateRequest | TaskUpdateRequest) => {
    createMutation.mutate(data as TaskCreateRequest);
  };

  const handleUpdate = (data: TaskCreateRequest | TaskUpdateRequest) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: data as TaskCreateRequest });
    }
  };

  const handleDelete = (taskId: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const getStatusBadgeColor = (status: Task['status']) => {
    switch (status) {
      case 'Todo':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'Done':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return null;
  }

  const assigneeOptions =
    user.role === 'Admin' || user.role === 'Manager' ? userChoices : [];
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
              <p className="text-muted-foreground">
                Manage and track your team's tasks
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter tasks by status, assignee, or search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-1 gap-4">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </Select>
                  <Select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    disabled={
                      user.role !== 'Member' && assigneeOptions.length === 0
                    }
                  >
                    <option value="">
                      {user.role === 'Member' ? 'Assigned to me' : 'All Assignees'}
                    </option>
                    {user.role !== 'Member' && (
                      <option value="mine">My Tasks</option>
                    )}
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.username} ({assignee.role})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                {totalTasks} task{totalTasks !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found. {canCreate && 'Create your first task to get started!'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Link
                            to="/tasks/$taskId"
                            params={{ taskId: task.id.toString() }}
                            className="text-primary hover:underline"
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                            {task.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.assignee_username || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {task.deadline
                            ? format(new Date(task.deadline), 'MMM dd, yyyy')
                            : 'No deadline'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(task.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEdit(task) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTask(task)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsCreateDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new task
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
            userRole={user.role}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogClose onClose={() => setEditingTask(null)} />
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTask(null)}
              isLoading={updateMutation.isPending}
              userRole={user.role}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

