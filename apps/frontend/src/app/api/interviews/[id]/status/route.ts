import { NextResponse } from 'next/server';
import { updateInterviewStatus } from '../../store';

const VALID_STATUSES = ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const interview = updateInterviewStatus(id, status);

  if (!interview) {
    return NextResponse.json({ message: 'Interview not found.' }, { status: 404 });
  }

  return NextResponse.json(interview);
}
