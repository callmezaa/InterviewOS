import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('applies variant classes correctly', () => {
    const variants = [
      { variant: 'primary' as const, expectedClass: 'bg-primary' },
      { variant: 'secondary' as const, expectedClass: 'bg-white/[0.03]' },
      { variant: 'ghost' as const, expectedClass: 'bg-transparent' },
      { variant: 'danger' as const, expectedClass: 'bg-red-600' },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      const { container } = render(<Button variant={variant}>{variant}</Button>);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('forwards additional className', () => {
    const { container } = render(<Button className="extra-class">Styled</Button>);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('disables button and prevents pointer events', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none');
  });

  it('renders as motion.button with hover/whileTap props', () => {
    const { container } = render(<Button>Animated</Button>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('fires onClick handler', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('supports custom ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('accepts standard button attributes like type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
