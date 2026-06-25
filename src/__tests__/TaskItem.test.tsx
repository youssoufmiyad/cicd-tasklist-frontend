import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const mockTask: Task = {
	id: 1,
	title: 'Ma tâche',
	description: 'Ma description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
	it('renders task title and description', () => {
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.getByText('Ma description')).toBeInTheDocument();
	});

	it('does not render description when null', () => {
		render(
			<TaskItem
				task={{ ...mockTask, description: null }}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.queryByText('Ma description')).not.toBeInTheDocument();
	});

	it('applies completed class when task is completed', () => {
		render(
			<TaskItem
				task={{ ...mockTask, completed: true }}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
	});

	it('calls onToggle with task id when checkbox is clicked', () => {
		const onToggle = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('enters edit mode when edit button is clicked', () => {
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		expect(screen.getByLabelText('Modifier le titre')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
	});

	it('calls onEdit with updated values and exits edit mode on save', () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), {
			target: { value: 'Nouveau titre' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Nouveau titre',
			description: 'Ma description',
		});
		expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
	});

	it('does not call onEdit when edit title is empty', () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), { target: { value: '' } });
		fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect(onEdit).not.toHaveBeenCalled();
	});

	it('cancels edit mode without calling onEdit', () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), {
			target: { value: 'Changement annulé' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onEdit).not.toHaveBeenCalled();
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
	});

	it('restores original values after cancel', () => {
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), {
			target: { value: 'Changement' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		fireEvent.click(screen.getByLabelText('Modifier'));
		expect(screen.getByLabelText('Modifier le titre')).toHaveValue('Ma tâche');
	});

	it('does not call onDelete on first delete click', () => {
		const onDelete = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
		);
		fireEvent.click(screen.getByLabelText('Supprimer'));
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('calls onDelete with task id on second delete click', () => {
		const onDelete = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
		);
		const deleteButton = screen.getByLabelText('Supprimer');
		fireEvent.click(deleteButton);
		fireEvent.click(deleteButton);
		expect(onDelete).toHaveBeenCalledWith(1);
	});

	it('saves description as undefined when description field is cleared', () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);
		fireEvent.click(screen.getByLabelText('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier la description'), { target: { value: '' } });
		fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Ma tâche',
			description: undefined,
		});
	});
});
