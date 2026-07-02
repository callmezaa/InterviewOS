import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useInView: () => true,
  };
});

describe('FeatureCard', () => {
  it('renders title and description', () => {
    render(
      <FeatureCard
        title="Realtime signaling"
        description="Sub-100ms peer connection."
        iconName="activity"
      />,
    );
    expect(screen.getByText('Realtime signaling')).toBeInTheDocument();
    expect(screen.getByText('Sub-100ms peer connection.')).toBeInTheDocument();
  });

  it('renders with different iconName', () => {
    render(
      <FeatureCard
        title="AI evaluation"
        description="Automated feedback."
        iconName="shield"
      />,
    );
    expect(screen.getByText('AI evaluation')).toBeInTheDocument();
  });

  it('renders a heading element for the title', () => {
    render(
      <FeatureCard
        title="Proctoring AI"
        description="Passive detection."
        iconName="eye"
      />,
    );
    const heading = screen.getByText('Proctoring AI');
    expect(heading.tagName).toBe('H3');
  });
});
