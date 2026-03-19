import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

async function fetchQuote(symbol) {
  // Try query2 first, fall back to query1
  const urls = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
  };

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;
      const meta = result.meta;
      const price = meta.regularMarketPrice ?? meta.chartPreviousClose;
      const prevClose = meta.previousClose ?? meta.chartPreviousClose;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;
      return { price, previousClose: prevClose, change, changePercent };
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET() {
  const indices = [
    { name: 'S&P 500',   symbol: '%5EGSPC' },
    { name: 'Dow Jones', symbol: '%5EDJI'  },
    { name: 'Nasdaq',    symbol: '%5EIXIC' },
  ];

  let marketData;
  try {
    const results = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const quote = await fetchQuote(symbol);
        if (!quote) throw new Error(`No data for ${name}`);
        return { name, ...quote };
      })
    );
    marketData = results;
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
