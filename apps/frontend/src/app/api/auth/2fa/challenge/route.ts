import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code || code.length !== 6) {
      return NextResponse.json(
        { message: 'Invalid verification code.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        name: 'Verified User',
        email: 'user@example.com',
        role: 'INTERVIEWER',
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
