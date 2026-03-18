export const dynamic = 'force-dynamic';

async function slackAPI(endpoint, params = {}) {
  const token = process.env.SLACK_USER_TOKEN;
  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

async function getUserName(userId) {
  const data = await slackAPI('users.info', { user: userId });
  if (data.ok) {
    return data.user.profile.display_name || data.user.profile.real_name || data.user.name;
  }
  return 'Unknown';
}

export async function GET() {
  const token = process.env.SLACK_USER_TOKEN;
  const myUserId = process.env.SLACK_USER_ID;

  if (!token || !myUserId) {
    return Response.json(
      { error: 'Add SLACK_USER_TOKEN and SLACK_USER_ID to Vercel environment variables.' },
      { status: 400 }
    );
  }

  const messages = [];
  const userCache = {};

  async function resolveName(userId) {
    if (!userCache[userId]) userCache[userId] = await getUserName(userId);
    return userCache[userId];
  }

  const since = String(Math.floor(Date.now() / 1000) - 86400);

  try {
    const searchData = await slackAPI('search.messages', {
      query: `<@${myUserId}>`,
      sort: 'timestamp',
      sort_dir: 'desc',
      count: '20',
    });

    if (searchData.ok && searchData.messages?.matches) {
      for (const match of searchData.messages.matches) {
        if (parseFloat(match.ts) < parseFloat(since)) continue;

        const fromName = await resolveName(match.user || match.username || 'unknown');
        const channelName = match.channel?.name ? `#${match.channel.name}` : 'Unknown';
        const permalink = match.permalink || '';

        let responded = false;
        try {
          if (match.channel?.id) {
            const history = await slackAPI('conversations.history', {
              channel: match.channel.id,
              oldest: match.ts,
              limit: '10',
            });
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
            text: (match.text || '').replace(/<@[A-Z0-9]+\|?[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200),
            timestamp: match.ts,
            permalink,
            time: new Date(parseFloat(match.ts) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    }

    const convos = await slackAPI('conversations.list', { types: 'im', limit: '50' });
    if (convos.ok && convos.channels) {
      for (const dm of convos.channels) {
        if (!dm.is_im) continue;

        const history = await slackAPI('conversations.history', {
          channel: dm.id,
          oldest: since,
          limit: '5',
        });

        if (!history.ok || !history.messages) continue;

        const otherMessages = history.messages.filter(m => m.user !== myUserId && m.user);
        if (otherMessages.length === 0) continue;

        const latestFromOther = otherMessages[0];
        const myLatestReply = history.messages.find(m => m.user === myUserId);
        const responded = myLatestReply && parseFloat(myLatestReply.ts) > parseFloat(latestFromOther.ts);

        if (!responded) {
          const fromName = await resolveName(latestFromOther.user);
          const permalink = `https://slack.com/archives/${dm.id}/p${latestFromOther.ts.replace('.', '')}`;

          messages.push({
            id: latestFromOther.ts,
            type: 'dm',
            from: fromName,
            channel: 'DM',
            text: (latestFromOther.text || '').replace(/<@[A-Z0-9]+>/g, '@user').slice(0, 200),
            timestamp: latestFromOther.ts,
            permalink,
            time: new Date(parseFloat(latestFromOther.ts) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    }

    const seen = new Set();
    const unique = messages
      .sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp))
      .filter(m => {
        const key = `${m.from}-${m.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return Response.json({ messages: unique });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch Slack data: ' + err.message }, { status: 500 });
  }
}
