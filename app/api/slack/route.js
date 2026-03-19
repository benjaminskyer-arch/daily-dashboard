export const dynamic = 'force-dynamic';

async function slackAPI(endpoint, params = {}, token) {
  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

async function getUserName(userId, token) {
  const data = await slackAPI('users.info', { user: userId }, token);
  if (data.ok) {
    return data.user.profile.display_name || data.user.profile.real_name || data.user.name;
  }
  return 'Unknown';
}

export async function GET() {
  // Accept either SLACK_USER_TOKEN (xoxp-) or SLACK_BOT_TOKEN (xoxb-)
  const token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
  const myUserId = process.env.SLACK_USER_ID;

  if (!token || !myUserId) {
    return Response.json(
      { error: 'Add SLACK_BOT_TOKEN and SLACK_USER_ID to your Vercel environment variables.' },
      { status: 400 }
    );
  }

  const isUserToken = token.startsWith('xoxp-');
  const messages = [];
  const userCache = {};

  async function resolveName(userId) {
    if (!userCache[userId]) userCache[userId] = await getUserName(userId, token);
    return userCache[userId];
  }

  const since = String(Math.floor(Date.now() / 1000) - 172800); // 48 hours

  try {
    // 1. Mentions — only works with User tokens (xoxp-)
    if (isUserToken) {
      const searchData = await slackAPI('search.messages', {
        query: `<@${myUserId}>`,
        sort: 'timestamp',
        sort_dir: 'desc',
        count: '20',
      }, token);

      if (searchData.ok && searchData.messages?.matches) {
        for (const match of searchData.messages.matches) {
          if (parseFloat(match.ts) < parseFloat(since)) continue;

          const fromName = await resolveName(match.user || match.username || 'unknown');
          const channelName = match.channel?.name ? `#${match.channel.name}` : 'Unknown';

          // Check if I've already replied
          let responded = false;
          try {
            if (match.channel?.id) {
              const history = await slackAPI('conversations.history', {
                channel: match.channel.id,
                oldest: match.ts,
                limit: '10',
              }, token);
              if (history.ok) {
                responded = history.messages?.some(m => m.user === myUserId) || false;
              }
            }
          } catch {}

          if (!responded) {
            messages.push({
              id: match.ts,
              type: 'mention',
              from: fromName,
              channel: channelName,
              text: (match.text || '')
                .replace(/<@[A-Z0-9]+\|([^>]+)>/g, '@$1')
                .replace(/<@[A-Z0-9]+>/g, '@user')
                .replace(/<[^>]+>/g, '')
                .slice(0, 200),
              timestamp: match.ts,
              permalink: match.permalink || '',
              time: new Date(parseFloat(match.ts) * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
              }),
            });
          }
        }
      }
    }

    // 2. Unread DMs — works with both bot and user tokens
    const convos = await slackAPI('conversations.list', { types: 'im', limit: '50' }, token);
    if (convos.ok && convos.channels) {
      for (const dm of convos.channels) {
        if (!dm.is_im) continue;

        const history = await slackAPI('conversations.history', {
          channel: dm.id,
          oldest: since,
          limit: '5',
        }, token);

        if (!history.ok || !history.messages) continue;

        const otherMessages = history.messages.filter(m => m.user !== myUserId && m.user);
        if (otherMessages.length === 0) continue;

        const latestFromOther = otherMessages[0];
        const myLatestReply = history.messages.find(m => m.user === myUserId);
        const responded = myLatestReply && parseFloat(myLatestReply.ts) > parseFloat(latestFromOther.ts);

        if (!responded) {
          const fromName = await resolveName(latestFromOther.user);
          messages.push({
            id: latestFromOther.ts,
            type: 'dm',
            from: fromName,
            channel: 'DM',
            text: (latestFromOther.text || '')
              .replace(/<@[A-Z0-9]+\|([^>]+)>/g, '@$1')
              .replace(/<@[A-Z0-9]+>/g, '@user')
              .replace(/<[^>]+>/g, '')
              .slice(0, 200),
            timestamp: latestFromOther.ts,
            permalink: `https://slack.com/archives/${dm.id}/p${latestFromOther.ts.replace('.', '')}`,
            time: new Date(parseFloat(latestFromOther.ts) * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
            }),
          });
        }
      }
    }

    // Sort newest first and deduplicate
    const seen = new Set();
    const unique = messages
      .sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp))
      .filter(m => {
        const key = `${m.from}-${m.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return Response.json({ messages: unique }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });

  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch Slack data: ' + err.message },
      { status: 500 }
    );
  }
}
