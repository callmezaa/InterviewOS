import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import { Mail } from 'lucide-react';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<Input icon={Mail} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders error message string', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styles when error is boolean true', () => {
    const { container } = render(<Input error />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500/30');
  });

  it('renders password toggle button for password type', () => {
    render(<Input type="password" />);
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('toggles password visibility on button click', async () => {
    const user = userEvent.setup();
    render(<Input type="password" />);
    const toggleButton = screen.getByLabelText('Show password');
    await user.click(toggleButton);
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('forwards value and fires onChange when user types', async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(<Input onChange={(e) => { values.push(e.target.value); }} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'a');
    expect(values.length).toBeGreaterThanOrEqual(1);
    expect(values[values.length - 1]).toBe('a');
  });

  it('applies size variants', () => {
    const sizes = [
      { size: 'sm' as const, expected: 'h-7' },
      { size: 'md' as const, expected: 'py-2.5' },
      { size: 'lg' as const, expected: 'py-3' },
    ];

    sizes.forEach(({ size, expected }) => {
      const { container } = render(<Input size={size} />);
      const input = container.querySelector('input');
      expect(input).toHaveClass(expected);
    });
  });

  it('forwards additional className', () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });

  it('disables input when disabled prop is set', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
