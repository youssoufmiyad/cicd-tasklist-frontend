import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, getTask, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	describe('getTasks', () => {
		it('returns array of tasks', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			}));
			const tasks = await getTasks();
			expect(tasks).toEqual([mockTask]);
			expect(fetch).toHaveBeenCalledWith('/api/tasks');
		});

		it('throws on error response', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error'),
			}));
			await expect(getTasks()).rejects.toThrow('HTTP 500');
		});
	});

	describe('getTask', () => {
		it('returns a task by id', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			}));
			const task = await getTask(1);
			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
		});

		it('throws on error response', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('Not Found'),
			}));
			await expect(getTask(99)).rejects.toThrow('HTTP 404');
		});
	});

	describe('createTask', () => {
		it('creates and returns a task', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			}));
			const task = await createTask({ title: 'Test' });
			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test' }),
			});
		});

		it('throws on error response', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve('Bad Request'),
			}));
			await expect(createTask({ title: '' })).rejects.toThrow('HTTP 400');
		});
	});

	describe('updateTask', () => {
		it('updates and returns a task', async () => {
			const updated = { ...mockTask, completed: true };
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(updated),
			}));
			const task = await updateTask(1, { completed: true });
			expect(task).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: true }),
			});
		});

		it('throws on error response', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('Not Found'),
			}));
			await expect(updateTask(99, { completed: true })).rejects.toThrow('HTTP 404');
		});
	});

	describe('deleteTask', () => {
		it('deletes a task successfully', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
			await expect(deleteTask(1)).resolves.toBeUndefined();
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
		});

		it('throws on error response', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				text: () => Promise.resolve('Not Found'),
			}));
			await expect(deleteTask(99)).rejects.toThrow('HTTP 404');
		});
	});
});
