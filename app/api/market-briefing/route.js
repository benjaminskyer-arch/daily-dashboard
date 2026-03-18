import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const indices = [
    { name: 'S&P 500', symbol: 'SPY' },
    { name: 'Dow Jones', symbol: 'DIA' },
    { name: 'Nasdaq', symbol: 'QQQ' },
  ];

  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) {
    return Response.json({ error: 'Add FINNHUB_API_KEY to Vercel environment variables.' }, { status: 400 });
  }

  let marketData;
  try {
    marketData = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`
        );
        const q = await res.json();
        return {
          name,
          price: q.c || 0,
          change: q.d || 0,
          changePercent: q.dp || 0,
          high: q.h || 0,
          low: q.l || 0,
          open: q.o || 0,
          prevClose: q.pc || 0,
        };
      })
    );
  } catch {
    return Response.json({ error: 'Could not fetch market data' }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      marketData,
      briefing: 'Add ANTHROPIC_API_KEY to Vercel to enable the market briefing.',
      vocabulary: [],
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const marketSummary = marketData.map(m =>
    `${m.name} (${m.name === 'S&P 500' ? 'SPY' : m.name === 'Dow Jones' ? 'DIA' : 'QQQ'}): $${m.price.toFixed(2)} | Change: ${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)} (${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(2)}%) | Open: $${m.open.toFixed(2)} | Range: $${m.low.toFixed(2)}-$${m.high.toFixed(2)}`
  ).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a sharp, concise financial briefer. Your reader is intelligent but not from a finance background — they want to understand the market well enough to hold their own with financial advisors and colleagues. Be direct, informative, and respectful of their intelligence. No condescension.\n\nToday's market data:\n${marketSummary}\n\nNote: SPY tracks the S&P 500, DIA tracks the Dow Jones, QQQ tracks the Nasdaq.\n\nReturn ONLY raw JSON (no markdown, no code fences):\n{"briefing": "3-4 sentences summarizing today's market. Explain the WHY if apparent. Connect it to real-world implications — 401k, mortgage rates, broader economy. Be specific.", "vocabulary": [{"term": "relevant term", "definition": "clear definition", "whyItMatters": "practical relevance to today"}], "dinnerPartyTip": "One sharp sentence to drop in conversation showing you follow markets. Specific to today's data."}\n\nInclude 3 vocabulary words relevant to today's moves.`,
      }],
    });
    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return Response.json({ marketData, ...parsed });
  } catch (err) {
    return Response.json({ marketData, briefing: 'Could not generate market briefing.', vocabulary: [] });
  }
}
