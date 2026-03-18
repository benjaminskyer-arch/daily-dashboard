import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const indices = [
    { name: 'S&P 500', symbol: '%5EGSPC' },
    { name: 'Dow Jones', symbol: '%5EDJI' },
    { name: 'Nasdaq', symbol: '%5EIXIC' },
  ];

  let marketData;
  try {
    marketData = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) {
          return { name, price: 0, previousClose: 0, change: 0, changePercent: 0 };
        }
        const change = meta.regularMarketPrice - meta.previousClose;
        const changePercent = (change / meta.previousClose) * 100;
        return { name, price: meta.regularMarketPrice, previousClose: meta.previousClose, change, changePercent };
      })
    );
  } catch {
    return Response.json({ error: 'Could not fetch market data' }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      marketData,
      briefing: 'Add your ANTHROPIC_API_KEY in Vercel to get the AI-powered briefing.',
      vocabulary: [],
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const marketSummary = marketData.map(m =>
    `${m.name}: $${m.price.toFixed(2)} (${m.change >= 0 ? '+' : ''}${m.changePercent.toFixed(2)}%)`
  ).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a friendly financial educator explaining today's stock market to someone who knows NOTHING about finance. Explain like they're 5 — simple analogies, zero jargon without explanation.\n\nToday's data:\n${marketSummary}\n\nReturn ONLY raw JSON (no markdown, no code fences):\n{"briefing": "3-4 sentences explaining what happened and why it matters to a regular person. Use analogies.", "vocabulary": [{"term": "term", "definition": "simple definition", "analogy": "think of it like..."}], "dinnerPartyTip": "One natural sentence to sound smart about today's market."}\n\nInclude 3-4 vocab words.`,
      }],
    });
    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return Response.json({ marketData, ...parsed });
  } catch (err) {
    return Response.json({ marketData, briefing: 'Could not generate AI briefing.', vocabulary: [] });
  }
}
