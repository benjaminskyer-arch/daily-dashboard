import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const indices = [
    { name: 'S&P 500', symbol: 'SPY' },
    { name: 'Dow Jones', symbol: 'DIA' },
    { name: 'Nasdaq', symbol: 'QQQ' },
  ];

  let marketData;
  try {
    marketData = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const res = await fetch(
          `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }
        );
        const data = await res.json();
        const price = data?.quoteSummary?.result?.[0]?.price;
        if (!price) return { name, price: 0, change: 0, changePercent: 0 };
        return {
          name,
          price: price.regularMarketPrice?.raw || 0,
          change: price.regularMarketChange?.raw || 0,
          changePercent: (price.regularMarketChangePercent?.raw || 0) * 100,
        };
      })
    );
  } catch {
    return Response.json({ error: 'Could not fetch market data' }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      marketData,
      briefing: 'Add your ANTHROPIC_API_KEY in Vercel to enable the market briefing.',
      vocabulary: [],
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const marketSummary = marketData.map(m =>
    `${m.name} (${m.name === 'S&P 500' ? 'SPY' : m.name === 'Dow Jones' ? 'DIA' : 'QQQ'}): $${m.price.toFixed(2)} (${m.change >= 0 ? '+' : ''}${m.changePercent.toFixed(2)}%)`
  ).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a sharp, concise financial briefer. Your reader is intelligent but not from a finance background — they want to understand the market well enough to hold their own in conversations with financial advisors, colleagues, and at dinner parties. Be direct, informative, and respectful of their intelligence. No baby talk, no condescension. Use clear analogies only when they genuinely clarify something complex.

Today's market data:
${marketSummary}

Note: SPY tracks the S&P 500, DIA tracks the Dow Jones, QQQ tracks the Nasdaq.

Return ONLY raw JSON (no markdown, no code fences):
{
  "briefing": "3-4 sentences summarizing today's market action. Explain the WHY behind the moves if apparent. Connect it to real-world implications — how might this affect someone's 401k, mortgage rates, or the broader economy. Be specific, not generic.",
  "vocabulary": [
    {"term": "a relevant finance term", "definition": "a clear one-sentence definition", "whyItMatters": "why this concept matters for understanding today's market"},
    {"term": "another term", "definition": "clear definition", "whyItMatters": "practical relevance"}
  ],
  "dinnerPartyTip": "One sharp, natural sentence the reader could drop in conversation that shows they follow the markets. Make it specific to today's data, not generic."
}

Include 3 vocabulary words that are relevant to today's market moves.`,
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
