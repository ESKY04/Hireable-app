export async function POST(request) {
  const { apiKey, ...body } = await request.json();

  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 400 });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}
