import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createEvent, type EventAttributes } from 'ics';

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  location?: string;
  url?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  generateIcsBuffer(event: CalendarEvent): Buffer | null {
    try {
      const start = new Date(event.startTime);
      const icsEvent: EventAttributes = {
        title: event.title,
        description: event.description,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ],
        duration: { minutes: event.durationMinutes },
        location: event.location || 'InterviewOS — Online Interview',
        url: event.url || this.frontendUrl,
        status: 'CONFIRMED',
        organizer: event.organizerName
          ? {
              name: event.organizerName,
              email: event.organizerEmail || 'noreply@interviewos.app',
            }
          : { name: 'InterviewOS', email: 'noreply@interviewos.app' },
        attendees: event.attendeeName
          ? [
              {
                name: event.attendeeName,
                email: event.attendeeEmail || '',
                rsvp: true,
              },
            ]
          : [],
        productId: 'interviewos/calendar',
      };

      const { error, value } = createEvent(icsEvent);
      if (error || !value) {
        this.logger.warn(`Failed to generate .ics: ${error}`);
        return null;
      }

      return Buffer.from(value, 'utf-8');
    } catch (err) {
      this.logger.warn(`ICS generation error: ${err}`);
      return null;
    }
  }

  generateGoogleCalendarUrl(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);

    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      location: event.location || 'InterviewOS — Online Interview',
      dates: `${fmt(start)}/${fmt(end)}`,
    });

    if (event.url)
      params.set('details', `${event.description}\n\nJoin: ${event.url}`);

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  generateOutlookCalendarUrl(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.url
        ? `${event.description}\n\nJoin: ${event.url}`
        : event.description,
      location: event.location || 'InterviewOS — Online Interview',
      startdt: start.toISOString(),
      enddt: end.toISOString(),
    });

    return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
  }

  generateCalendarLinks(event: CalendarEvent) {
    return {
      google: this.generateGoogleCalendarUrl(event),
      outlook: this.generateOutlookCalendarUrl(event),
      ics: this.generateIcsBuffer(event),
    };
  }
}
