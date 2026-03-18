import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const feeds = [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NYT', type: 'national' },
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC', type: 'national' },
    { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR', type: 'national' },
    { url: 'https://gothamist.com/feed', source: 'Gothamist', type: 'nyc' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/NYRegion.xml', source: 'NYT', type: 'nyc' },
  ];

  let allArticles = [];
  try {
    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=10`
        );
        const data = await res.json();
        if (data.status === 'ok') {
          return data.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: feed.source,
            type: feed.type,
          }));
        }
        return [];
      })
    );
    allArticles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
  } catch {
    return Response.json({ error: 'Could not fetch news feeds' }, { status: 500 });
  }

  if (allArticles.length === 0) {
    return Response.json({ error: 'No articles available' }, { status: 500 });
  }

  const nationalRaw = allArticles.filter(a => a.type === 'national');
  const nycRaw = allArticles.filter(a => a.type === 'nyc');

  const nationalList = nationalRaw.slice(0, 15).map((a, i) =>
    `${i + 1}. [${a.source}] "${a.title}" — ${a.link}`
  ).join('\n');

  const nycList = nycRaw.slice(0, 10).map((a, i) =>
    `${i + 1}. [${a.source}] "${a.title}" — ${a.link}`
  ).join('\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      national: nationalRaw.slice(0, 6).map(a => ({ ...a, analysis: '', tags: [] })),
      nyc: nycRaw.slice(0, 4).map(a => ({ ...a, analysis: '', tags: [] })),
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a sharp news analyst. Your reader is an intelligent professional in NYC who wants to stay informed about national news and local NYC news, understanding how each story connects to the stock market, government policy, or their daily life.\n\nHere are today's national headlines:\n${nationalList}\n\nHere are today's NYC headlines:\n${nycList}\n\nSelect the most important stories and return ONLY raw JSON (no markdown, no code fences):\n{"national": [{"title": "headline text", "source": "source name", "link": "original URL — MUST be the exact URL from above", "analysis": "1-2 sentences: why this matters, how it connects to markets, policy, or the economy. Be specific and insightful.", "tags": ["Market impact", "Policy", "Economy", "Tech", "Geopolitics", or "Energy" — pick 1-2]}], "nyc": [{"title": "headline text", "source": "source name", "link": "original URL — MUST be the exact URL from above", "analysis": "1-2 sentences: why this matters for someone living in NYC.", "tags": ["Transit", "Housing", "Policy", "Economy", "Safety", or "Culture" — pick 1-2]}]}\n\nReturn 5-6 national stories and 3-4 NYC stories. Prioritize significance. CRITICAL: preserve the exact original URLs.`,
      }],
    });

    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return Response.json(parsed);
  } catch (err) {
    return Response.json({
      national: nationalRaw.slice(0, 6).map(a => ({ ...a, analysis: 'Analysis unavailable.', tags: [] })),
      nyc: nycRaw.slice(0, 4).map(a => ({ ...a, analysis: 'Analysis unavailable.', tags: [] })),
    });
  }
}
