import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('renders edit mode when mode is edit', () => {
		render(<TaskForm onSubmit={vi.fn()} mode="edit" />);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
	});

	it('populates fields with initialValues', () => {
		render(
			<TaskForm
				onSubmit={vi.fn()}
				initialValues={{ title: 'Mon titre', description: 'Ma description' }}
			/>
		);
		expect(screen.getByLabelText('Titre')).toHaveValue('Mon titre');
		expect(screen.getByLabelText('Description')).toHaveValue('Ma description');
	});

	it('shows validation error when title is empty on submit', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
	});

	it('does not call onSubmit when title is empty', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('calls onSubmit with title and description', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Ma tâche' } });
		fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Ma desc' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Ma tâche', description: 'Ma desc' });
	});

	it('calls onSubmit with undefined description when description is empty', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Ma tâche' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Ma tâche', description: undefined });
	});

	it('trims title before submit', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '  Ma tâche  ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ma tâche' }));
	});

	it('resets form after submit in create mode', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		const titleInput = screen.getByLabelText('Titre');
		fireEvent.change(titleInput, { target: { value: 'Ma tâche' } });
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(titleInput).toHaveValue('');
	});

	it('does not reset form after submit in edit mode', () => {
		render(
			<TaskForm onSubmit={vi.fn()} mode="edit" initialValues={{ title: 'Ma tâche' }} />
		);
		const titleInput = screen.getByLabelText('Titre');
		fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		expect(titleInput).toHaveValue('Ma tâche');
	});

	it('shows cancel button when onCancel is provided', () => {
		render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
	});

	it('does not show cancel button without onCancel', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
	});

	it('calls onCancel when cancel button is clicked', () => {
		const onCancel = vi.fn();
		render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('clears validation error when user starts typing', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByRole('alert')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'T' } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
