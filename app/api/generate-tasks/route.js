import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Add ANTHROPIC_API_KEY to your Vercel environment variables.' },
      { status: 400 }
    );
  }

  const { notes } = await request.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract actionable tasks from these notes. Return ONLY a raw JSON object with no markdown, no code fences, no explanation.\n\nNotes:\n${notes}\n\nFormat: {"tasks": [{"text": "task", "priority": "high"}, {"text": "task", "priority": "medium"}]}\n\nPriority must be high, medium, or low.`,
      }],
    });

    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: 'Failed to generate tasks: ' + err.message }, { status: 500 });
  }
}
