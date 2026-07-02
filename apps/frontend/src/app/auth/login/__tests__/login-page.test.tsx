import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useInterviewStore } from '../../../../store/useInterviewStore';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('framer-motion', () => {
  const motionComponents: Record<string, any> = {};
  function createMotionComponent(tag: string) {
    return ({ children, ...props }: any) => {
      const { whileHover, whileTap, variants, initial, animate, exit, layout, onAnimationComplete, transition, ...rest } = props;
      return React.createElement(tag, rest, children);
    };
  }
  return {
    motion: new Proxy({}, { get: (_, tag) => {
      if (typeof tag !== 'string') return;
      if (!motionComponents[tag]) motionComponents[tag] = createMotionComponent(tag);
      return motionComponents[tag];
    }}),
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useInView: () => true,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  };
});

beforeEach(() => {
  mockPush.mockClear();
  vi.stubGlobal('fetch', vi.fn());
  useInterviewStore.setState({
    user: null,
    peers: [],
    chatMessages: [],
    transcriptItems: [],
    proctoringLogs: [],
  });
});

function getSubmitBtn(): HTMLButtonElement {
  return screen.getByText('Sign in').closest('button')!;
}

async function renderLoginPage() {
  const Page = (await import('../page')).default;
  return render(<Page />);
}

describe('LoginPage', () => {
  it('renders email and password inputs', async () => {
    await renderLoginPage();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('submits the form and sets auth on success', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'INTERVIEWER' as const,
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: mockUser,
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      }),
    } as Response);

    await renderLoginPage();
    await user.type(screen.getByPlaceholderText('you@company.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      const state = useInterviewStore.getState();
      expect(state.user).toEqual(mockUser);
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error state on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await renderLoginPage();
    await user.type(screen.getByPlaceholderText('you@company.com'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'bad-password');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(useInterviewStore.getState().user).toBeNull();
    });
  });

  it('shows email verification warning on 403 EMAIL_NOT_VERIFIED', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email' }),
    } as Response);

    await renderLoginPage();
    await user.type(screen.getByPlaceholderText('you@company.com'), 'unverified@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
    });
  });

  it('shows resend verification link when email is unverified', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email' }),
    } as Response);

    await renderLoginPage();
    await user.type(screen.getByPlaceholderText('you@company.com'), 'unverified@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(getSubmitBtn());

    await waitFor(() => {
      const resendLink = screen.getByRole('link', { name: /resend verification link/i });
      expect(resendLink).toBeInTheDocument();
      expect(resendLink).toHaveAttribute('href', '/auth/resend-verification?email=unverified%40test.com');
    });
  });

  it('renders forgot password link', async () => {
    await renderLoginPage();
    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('renders create account link', async () => {
    await renderLoginPage();
    const createLink = screen.getByRole('link', { name: /create one free/i });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute('href', '/auth/register');
  });

  it('renders OAuth buttons', async () => {
    await renderLoginPage();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });
});
