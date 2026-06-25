import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

vi.mock('../api/taskApi');

const mockTask = {
	id: 1,
	title: 'Test task',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe('useTasks', () => {
	it('starts in loading state and loads tasks on mount', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([mockTask]);
		expect(result.current.error).toBeNull();
	});

	it('sets error message when loadTasks fails with Error', async () => {
		vi.mocked(taskApi.getTasks).mockRejectedValue(new Error('Network error'));
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Network error');
		expect(result.current.tasks).toEqual([]);
	});

	it('sets fallback error when rejection is not an Error instance', async () => {
		vi.mocked(taskApi.getTasks).mockRejectedValue('unexpected failure');
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Une erreur est survenue');
	});

	it('addTask prepends new task to the list', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([]);
		const newTask = { ...mockTask, id: 2, title: 'Nouvelle tâche' };
		vi.mocked(taskApi.createTask).mockResolvedValue(newTask);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Nouvelle tâche' });
		});

		expect(result.current.tasks).toEqual([newTask]);
	});

	it('editTask replaces the updated task in the list', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
		const updatedTask = { ...mockTask, title: 'Modifiée' };
		vi.mocked(taskApi.updateTask).mockResolvedValue(updatedTask);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { title: 'Modifiée' });
		});

		expect(result.current.tasks[0].title).toBe('Modifiée');
		expect(taskApi.updateTask).toHaveBeenCalledWith(1, { title: 'Modifiée' });
	});

	it('removeTask removes the task from the list', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
		vi.mocked(taskApi.deleteTask).mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toEqual([]);
		expect(taskApi.deleteTask).toHaveBeenCalledWith(1);
	});

	it('toggleComplete calls updateTask with negated completed value', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
		const toggled = { ...mockTask, completed: true };
		vi.mocked(taskApi.updateTask).mockResolvedValue(toggled);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('toggleComplete does nothing when task id is not found', async () => {
		vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(taskApi.updateTask).not.toHaveBeenCalled();
	});

	it('loadTasks resets error and reloads tasks', async () => {
		vi.mocked(taskApi.getTasks)
			.mockRejectedValueOnce(new Error('Fail'))
			.mockResolvedValueOnce([mockTask]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.error).toBe('Fail'));

		await act(async () => {
			await result.current.loadTasks();
		});

		expect(result.current.error).toBeNull();
		expect(result.current.tasks).toEqual([mockTask]);
	});
});
