import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getTasks, createTask } from './tasks';
import type { Task } from './types';

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Write docs',
    description: 'Document the deployment process',
    status: 'In Progress',
    deadline: null,
    assignee: 1,
    assignee_username: 'admin',
    assignee_email: 'admin@example.com',
    assignee_role: 'Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'QA tasks',
    description: 'Verify filters',
    status: 'Done',
    deadline: null,
    assignee: 2,
    assignee_username: 'manager',
    assignee_email: 'manager@example.com',
    assignee_role: 'Manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const server = setupServer(
  http.get('*/tasks/', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const filtered = status ? mockTasks.filter((task) => task.status === status) : mockTasks;
    return HttpResponse.json(filtered);
  }),
  http.post('*/tasks/', async ({ request }) => {
    const body = (await request.json()) as Partial<Task>;
    return HttpResponse.json(
      {
        ...body,
        id: 99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('tasks api client', () => {
  it('filters tasks by status on getTasks', async () => {
    const results = await getTasks({ status: 'Done' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('QA tasks');
  });

  it('creates a new task via createTask', async () => {
    const payload = {
      title: 'New Task',
      description: 'Write tests',
      status: 'Todo' as Task['status'],
      assignee: null,
      deadline: null,
    };
    const result = await createTask(payload);
    expect(result.id).toBe(99);
    expect(result.title).toBe(payload.title);
  });
});

