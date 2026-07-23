import { NextResponse } from 'next/server';
import { registeredUsers } from '../register/route';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const existing = registeredUsers.get(email);
    const userName = existing?.name ?? email.split('@')[0];
    const role = existing?.role ?? 'CANDIDATE';

    return NextResponse.json({
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        name: userName,
        email,
        role,
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
