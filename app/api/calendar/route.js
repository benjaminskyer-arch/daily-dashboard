export const dynamic = 'force-dynamic';

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to refresh access token');
  return data.access_token;
}

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return Response.json(
      { error: 'Calendar not configured.' },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getAccessToken();
    const tz = 'America/New_York';

    // Get start/end of today in EST
    const now = new Date();
    const todayStart = new Date(now.toLocaleDateString('en-US', { timeZone: tz }));
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const params = new URLSearchParams({
      timeMin: todayStart.toISOString(),
      timeMax: todayEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '20',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (data.error) {
      return Response.json(
        { error: `Calendar API error: ${data.error.message}` },
        { status: 500 }
      );
    }

    const events = (data.items || [])
      .filter(e => e.status !== 'cancelled')
      .map(e => {
        const isAllDay = !!e.start?.date;
        let time = '';
        let startMs = 0;

        if (isAllDay) {
          time = 'All day';
          startMs = new Date(e.start.date).getTime();
        } else {
          const start = new Date(e.start.dateTime);
          const end = new Date(e.end.dateTime);
          startMs = start.getTime();
          const startStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
          const endStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
          time = `${startStr} – ${endStr}`;
        }

        return {
          id: e.id,
          title: e.summary || '(No title)',
          time,
          startMs,
          location: e.location || null,
          meetLink: e.hangoutLink || null,
          isAllDay,
        };
      });

    return Response.json({ events }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch calendar: ' + err.message }, { status: 500 });
  }
}
