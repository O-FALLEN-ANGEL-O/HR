
'use server';

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
// This private key is sensitive and must be handled carefully.
// In this format, newline characters are replaced with '\\n'.
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!GOOGLE_CALENDAR_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
  console.warn('Google Calendar environment variables are not fully set. Calendar integration will be disabled.');
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

type CalendarEventOptions = {
    summary: string;
    description: string;
    start: Date;
    attendees: { email: string }[];
}

export async function createCalendarEvent({ summary, description, start, attendees }: CalendarEventOptions): Promise<string | null> {
  // Check if credentials are set before proceeding
  if (!GOOGLE_CALENDAR_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.log('Skipping calendar event creation due to missing configuration.');
    return null;
  }

  // Events are 1 hour long by default
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  
  const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
    summary,
    description,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'Asia/Kolkata', // Set your timezone
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'Asia/Kolkata', // Set your timezone
    },
    attendees,
    reminders: {
      useDefault: true,
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: event,
      sendNotifications: true, // Send invites to attendees
    });
    console.log('Calendar event created:', res.data.htmlLink);
    return res.data.id || null;
  } catch (error: any) {
    console.error('Error creating calendar event:', error.response?.data || error.message);
    throw new Error('Failed to create calendar event.');
  }
}
