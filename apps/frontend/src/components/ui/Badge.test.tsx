import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-white/[0.02]');
  });

  it('applies variant classes correctly', () => {
    const variants = [
      { variant: 'primary' as const, expectedClass: 'bg-primary/10' },
      { variant: 'success' as const, expectedClass: 'bg-emerald-400/10' },
      { variant: 'warning' as const, expectedClass: 'bg-amber-400/10' },
      { variant: 'danger' as const, expectedClass: 'bg-red-500/10' },
      { variant: 'neutral' as const, expectedClass: 'bg-white/[0.04]' },
      { variant: 'solid' as const, expectedClass: 'bg-primary' },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('applies size variants', () => {
    const sizes = [
      { size: 'sm' as const, expectedClass: 'text-[9px]' },
      { size: 'md' as const, expectedClass: 'text-[11px]' },
      { size: 'lg' as const, expectedClass: 'text-[11px]' },
    ];

    sizes.forEach(({ size, expectedClass }) => {
      const { container } = render(<Badge size={size}>{size}</Badge>);
      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('renders dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    const spans = container.querySelectorAll('span');
    const dot = Array.from(spans).find(s => s.className.includes('rounded-full'));
    expect(dot).toBeInTheDocument();
  });

  it('renders custom dot color', () => {
    const { container } = render(<Badge dot dotColor="bg-green-500">Custom Dot</Badge>);
    const spans = container.querySelectorAll('span');
    const dot = Array.from(spans).find(s => s.className.includes('rounded-full'));
    expect(dot).toHaveClass('bg-green-500');
  });

  it('forwards additional className', () => {
    const { container } = render(<Badge className="custom-badge">Styled</Badge>);
    expect(container.firstChild).toHaveClass('custom-badge');
  });

  it('renders with ref', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('uses rounded-pill class for pill shape', () => {
    const { container } = render(<Badge>Pill</Badge>);
    expect(container.firstChild).toHaveClass('rounded-pill');
  });
});
