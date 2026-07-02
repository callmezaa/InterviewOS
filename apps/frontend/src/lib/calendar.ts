export interface CalendarEventInput {
  title: string;
  description: string;
  startTime: Date | string;
  durationMinutes?: number;
  url?: string;
  location?: string;
}

function toGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const start = new Date(event.startTime);
  const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.url
      ? `${event.description}\n\nJoin: ${event.url}`
      : event.description,
    location: event.location ?? 'InterviewOS — Online Interview',
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(event: CalendarEventInput): string {
  const start = new Date(event.startTime);
  const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60000);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.url
      ? `${event.description}\n\nJoin: ${event.url}`
      : event.description,
    location: event.location ?? 'InterviewOS — Online Interview',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}
