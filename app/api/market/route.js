export async function GET() {
  const indices = [
    { name: 'S&P 500', symbol: '%5EGSPC' },
    { name: 'Dow Jones', symbol: '%5EDJI' },
    { name: 'Nasdaq', symbol: '%5EIXIC' },
  ];
  try {
    const results = await Promise.all(
      indices.map(async ({ name, symbol }) => {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const data = await res.json();
        const meta = data.chart.result[0].meta;
        const change = meta.regularMarketPrice - meta.previousClose;
        const changePercent = (change / meta.previousClose) * 100;
        return { name, price: meta.regularMarketPrice, change, changePercent };
      })
    );
    return Response.json(results);
  } catch {
    return Response.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

