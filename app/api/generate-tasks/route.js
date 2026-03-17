import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Add ANTHROPIC_API_KEY to your Vercel environment variables to enable AI task generation.' },
      { status: 400 }
    );
  }
  const { notes } = await request.json();
  const client = new Anthropic();
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract actionable tasks from these notes. Return ONLY valid JSON, no markdown, no explanation.\n\nNotes:\n${notes}\n\nReturn this exact format:\n{"tasks": [{"text": "task description", "priority": "high"}, {"text": "another task", "priority": "medium"}]}\n\nPriority must be "high", "medium", or "low".`,
      }],
    });
    const parsed = JSON.parse(message.content[0].text.trim());
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}
