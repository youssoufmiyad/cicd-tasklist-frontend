import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

const defaultProps = {
	loading: false,
	error: null,
	onToggle: vi.fn(),
	onDelete: vi.fn(),
	onEdit: vi.fn(),
};

describe('TaskList', () => {
	it('shows loading state', () => {
		render(<TaskList {...defaultProps} tasks={[]} loading={true} />);
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('shows error state', () => {
		render(<TaskList {...defaultProps} tasks={[]} error="Erreur réseau" />);
		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(screen.getByText(/Erreur réseau/)).toBeInTheDocument();
	});

	it('shows empty state when no tasks', () => {
		render(<TaskList {...defaultProps} tasks={[]} />);
		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
	});

	it('renders list of tasks', () => {
		render(<TaskList {...defaultProps} tasks={mockTasks} />);
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
	});

	it('uses singular form for one task', () => {
		render(<TaskList {...defaultProps} tasks={[mockTasks[0]]} />);
		expect(screen.getByText('1 tâche')).toBeInTheDocument();
	});

	it('shows completed count', () => {
		render(<TaskList {...defaultProps} tasks={mockTasks} />);
		expect(screen.getByText(/1 terminée/)).toBeInTheDocument();
	});

	it('uses plural for multiple completed tasks', () => {
		const allCompleted = mockTasks.map((t) => ({ ...t, completed: true }));
		render(<TaskList {...defaultProps} tasks={allCompleted} />);
		expect(screen.getByText(/2 terminées/)).toBeInTheDocument();
	});
});
