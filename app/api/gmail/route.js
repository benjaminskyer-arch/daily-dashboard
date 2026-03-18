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

async function gmailFetch(path, accessToken) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

function extractHeader(headers, name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBody(part) {
  if (!part?.body?.data) return '';
  try {
    return Buffer.from(part.body.data, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function getSnippetFromParts(payload) {
  // Try plain text first, then html
  if (payload.mimeType === 'text/plain') return decodeBody(payload).slice(0, 200);
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain) return decodeBody(plain).slice(0, 200);
  }
  return '';
}

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return Response.json(
      { error: 'Gmail not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to Vercel.' },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getAccessToken();

    // Fetch unread messages — UNREAD label covers all categories (Inbox, Promotions, etc.)
    const listData = await gmailFetch(
      '/users/me/messages?labelIds=UNREAD&maxResults=10',
      accessToken
    );

    // Surface any API-level errors from Google
    if (listData.error) {
      return Response.json({ error: `Gmail API error: ${listData.error.message || JSON.stringify(listData.error)}` }, { status: 500 });
    }

    if (!listData.messages || listData.messages.length === 0) {
      return Response.json({ emails: [] });
    }

    const emails = await Promise.all(
      listData.messages.map(async ({ id }) => {
        const msg = await gmailFetch(
          `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          accessToken
        );

        const headers = msg.payload?.headers || [];
        const from = extractHeader(headers, 'From');
        const subject = extractHeader(headers, 'Subject');
        const date = extractHeader(headers, 'Date');

        // Parse sender name vs email
        const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
        const emailMatch = from.match(/<([^>]+)>/);
        const senderName = nameMatch ? nameMatch[1].trim() : (emailMatch ? emailMatch[1] : from);
        const senderEmail = emailMatch ? emailMatch[1] : from;

        // Format time in EST
        let time = '';
        try {
          const d = new Date(date);
          const tz = 'America/New_York';
          const todayStr = new Date().toLocaleDateString('en-US', { timeZone: tz });
          const emailStr = d.toLocaleDateString('en-US', { timeZone: tz });
          const isToday = todayStr === emailStr;
          time = isToday
            ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz })
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz });
        } catch {}

        return {
          id,
          from: senderName,
          email: senderEmail,
          subject: subject || '(no subject)',
          snippet: msg.snippet || '',
          time,
        };
      })
    );

    return Response.json({ emails });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch Gmail: ' + err.message }, { status: 500 });
  }
}
