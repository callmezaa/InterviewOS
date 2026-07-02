import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass('bg-surface-tile-1/40');
  });

  it('applies variant classes correctly', () => {
    const variants = [
      { variant: 'default' as const, expectedClass: 'bg-surface-tile-1/40' },
      { variant: 'interactive' as const, expectedClass: 'cursor-pointer' },
      { variant: 'elevated' as const, expectedClass: 'bg-surface-tile-2/95' },
      { variant: 'ghost' as const, expectedClass: 'bg-white/[0.01]' },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      const { container } = render(<Card variant={variant}>{variant}</Card>);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('applies padding variants', () => {
    const paddings = [
      { padding: 'none' as const, expectedClass: '' },
      { padding: 'sm' as const, expectedClass: 'p-4' },
      { padding: 'md' as const, expectedClass: 'p-6' },
      { padding: 'lg' as const, expectedClass: 'p-8' },
    ];

    paddings.forEach(({ padding, expectedClass }) => {
      const { container } = render(<Card padding={padding}>{padding}</Card>);
      if (expectedClass) {
        expect(container.firstChild).toHaveClass(expectedClass);
      }
    });
  });

  it('forwards additional className', () => {
    const { container } = render(<Card className="extra-class">Styled</Card>);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('renders with ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>Ref</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes additional HTML attributes', () => {
    render(<Card data-testid="test-card">Test</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });

  it('renders complex children', () => {
    render(
      <Card>
        <h3>Title</h3>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
