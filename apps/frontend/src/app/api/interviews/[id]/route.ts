import { NextResponse } from 'next/server';
import { getInterviews, deleteInterview } from '../store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const interview = getInterviews().find((iv) => iv.id === id);

  if (!interview) {
    return NextResponse.json({ message: 'Interview not found.' }, { status: 404 });
  }

  return NextResponse.json(interview);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteInterview(id);

  if (!deleted) {
    return NextResponse.json({ message: 'Interview not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
