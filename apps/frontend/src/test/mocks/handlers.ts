import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 'test-user-1',
      email: 'test@interviewos.com',
      name: 'Test User',
      role: 'INTERVIEWER',
    });
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-1',
        email: 'test@interviewos.com',
        name: 'Test User',
        role: 'INTERVIEWER',
      },
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-1',
        email: 'test@interviewos.com',
        name: 'Test User',
        role: 'INTERVIEWER',
      },
      token: 'mock-jwt-token',
    });
  }),

  http.get('/api/interviews', () => {
    return HttpResponse.json([
      {
        id: 'interview-1',
        title: 'Frontend Engineering Interview',
        description: 'Mid-level frontend position',
        status: 'SCHEDULED',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        language: 'javascript',
        createdAt: new Date().toISOString(),
        participants: [
          {
            id: 'p-1',
            userId: 'test-user-1',
            role: 'INTERVIEWER',
            user: { id: 'test-user-1', email: 'test@interviewos.com', name: 'Test User', role: 'INTERVIEWER' },
          },
        ],
      },
      {
        id: 'interview-2',
        title: 'Backend Engineering Interview',
        description: 'Senior backend position',
        status: 'COMPLETED',
        scheduledTime: new Date(Date.now() - 86400000).toISOString(),
        language: 'python',
        createdAt: new Date().toISOString(),
        participants: [
          {
            id: 'p-2',
            userId: 'test-user-1',
            role: 'INTERVIEWER',
            user: { id: 'test-user-1', email: 'test@interviewos.com', name: 'Test User', role: 'INTERVIEWER' },
          },
        ],
      },
    ]);
  }),

  http.post('/api/interviews', () => {
    return HttpResponse.json({
      id: 'interview-3',
      title: 'New Interview',
      description: 'Description',
      status: 'SCHEDULED',
      scheduledTime: new Date(Date.now() + 172800000).toISOString(),
      candidateEmail: 'candidate@test.com',
      candidateToken: 'mock-candidate-token',
      createdAt: new Date().toISOString(),
    });
  }),

  http.post('/api/billing/create-checkout-session', () => {
    return HttpResponse.json({ url: 'https://checkout.stripe.com/mock' });
  }),

  http.get('/api/notifications', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/notifications/unread-count', () => {
    return HttpResponse.json({ count: 0 });
  }),

  http.get('/api/questions', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  }),

  http.get('/api/templates', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/webrtc/ice-config', () => {
    return HttpResponse.json({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
  }),

  http.get('/api/billing/subscription', () => {
    return HttpResponse.json({
      plan: 'FREE',
      status: 'active',
      trialEndsAt: null,
    });
  }),
];
