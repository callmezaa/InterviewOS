import { NextResponse } from 'next/server';

export const registeredUsers = new Map<string, { name: string; role: string; registeredAt: string }>();

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Name, email, and password are required.' },
        { status: 400 },
      );
    }

    const userRole = role === 'INTERVIEWER' ? 'INTERVIEWER' : 'CANDIDATE';
    registeredUsers.set(email, { name, role: userRole, registeredAt: new Date().toISOString() });

    return NextResponse.json({
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        name,
        email,
        role: userRole,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body.' },
      { status: 400 },
    );
  }
}
