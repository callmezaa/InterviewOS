import { NextResponse } from 'next/server';
import { getInterviews, addInterview } from './store';

export async function GET() {
  return NextResponse.json(getInterviews());
}

export async function POST(req: Request) {
  try {
    const { title, scheduledTime, description, candidateEmail, recurrence } =
      await req.json();

    if (!title || !scheduledTime) {
      return NextResponse.json(
        { message: 'Title and scheduledTime are required.' },
        { status: 400 },
      );
    }

    const interview = {
      id: 'iv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title,
      description: description || '',
      candidateEmail: candidateEmail || '',
      status: 'SCHEDULED' as const,
      scheduledTime: new Date(scheduledTime).toISOString(),
      codeContent: '',
      language: 'javascript',
      transcript: [],
    };

    addInterview(interview);

    return NextResponse.json(interview, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body.' },
      { status: 400 },
    );
  }
}
