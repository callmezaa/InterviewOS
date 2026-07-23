import { NextResponse } from 'next/server';
import { rescheduleInterview } from '../../store';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { scheduledTime } = await request.json();

  if (!scheduledTime) {
    return NextResponse.json({ message: 'scheduledTime is required.' }, { status: 400 });
  }

  const interview = rescheduleInterview(id, scheduledTime);

  if (!interview) {
    return NextResponse.json({ message: 'Interview not found.' }, { status: 404 });
  }

  return NextResponse.json(interview);
}
