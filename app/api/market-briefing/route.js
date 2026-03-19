import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

async function fetchQuote(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Finnhub request failed for ${symbol}`);
  const data = await res.json();
  // data.c = current price, data.pc = previous close, data.d = change, data.dp = % change
  if (!data.c || data.c === 0) throw new Error(`No data returned for ${symbol}`);
  return {
    price: data.c,
    previousClose: data.pc,
    change: data.d,
    changePercent: data.dp,
  };
}

export async function GET() {
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!finnhubKey) {
    return Response.json(
      { error: 'Add FINNHUB_API_KEY to your Vercel environment variables.' },
      { status: 400 }
    );
  }

  // Finnhub free tier doesn't support ^ index symbols — use ETF proxies instead
  const indices = [
    { name: 'S&P 500',   symbol: 'SPY'  }, // SPDR S&P 500 ETF
    { name: 'Dow Jones', symbol: 'DIA'  }, // SPDR Dow Jones ETF
    { name: 'Nasdaq',    symbol: 'QQQ'  }, // Invesco Nasdaq-100 ETF
  ];

  let marketData;
  try {
    marketData = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const quote = await fetchQuote(symbol, finnhubKey);
        return { name, ...quote };
      })
    );
  } catch (err) {
    return Response.json(
      { error: 'Could not fetch market data: ' + err.message },
      { status: 500 }
    );
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
    `${m.name}: $${m.price.toFixed(2)} (${m.change >= 0 ? '+' : ''}${m.changePercent.toFixed(2)}% / ${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)} pts from yesterday's $${m.previousClose.toFixed(2)})`
  ).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a friendly financial educator explaining today's stock market to someone who knows NOTHING about finance. Explain it like they're 5 years old — use simple analogies, everyday language, and zero jargon without explanation.

Here is today's market data:
${marketSummary}

Return ONLY a raw JSON object (no markdown, no code fences). Use this exact format:
{
  "briefing": "A 3-4 sentence plain-English summary of what happened in the market today and why it matters to a regular person. Use analogies like 'think of it like...' to make it relatable. Be warm and encouraging, not scary.",
  "vocabulary": [
    {"term": "a finance term mentioned above", "definition": "a one-sentence definition a 5-year-old could understand", "analogy": "think of it like..."},
    {"term": "another term", "definition": "simple definition", "analogy": "simple analogy"}
  ],
  "dinnerPartyTip": "One impressive-sounding sentence the user could casually say at a dinner party to sound smart about today's market. Make it natural, not cringe."
}

Include 3-4 vocabulary words. Make the dinner party tip feel natural and conversational.`,
      }],
    });

    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return Response.json({ marketData, ...parsed });
  } catch (err) {
    return Response.json({
      marketData,
      briefing: 'Could not generate AI briefing: ' + err.message,
      vocabulary: [],
    });
  }
}
