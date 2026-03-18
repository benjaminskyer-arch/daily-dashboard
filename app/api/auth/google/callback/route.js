export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return new Response(renderPage('Authorization failed', `<p class="error">Google returned an error: ${error || 'no code received'}</p>`), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://project-ldl66.vercel.app'}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return new Response(renderPage('Token exchange failed', `<p class="error">${tokens.error}: ${tokens.error_description}</p>`), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return new Response(renderPage('No refresh token', `
        <p class="error">Google didn't return a refresh token. This can happen if you've authorized this app before.</p>
        <p>To fix this: <a href="https://myaccount.google.com/permissions" target="_blank">Revoke access here</a>, then <a href="/api/auth/google">try again</a>.</p>
      `), { headers: { 'Content-Type': 'text/html' } });
    }

    return new Response(renderPage('Success! Gmail connected', `
      <p class="success">✓ Authorization successful! Copy your refresh token below and add it to Vercel.</p>
      <div class="token-box">
        <p class="label">GOOGLE_REFRESH_TOKEN</p>
        <code id="token">${refreshToken}</code>
        <button onclick="navigator.clipboard.writeText('${refreshToken}').then(() => this.textContent = 'Copied!')">Copy</button>
      </div>
      <div class="steps">
        <h3>Next steps:</h3>
        <ol>
          <li>Click <strong>Copy</strong> above</li>
          <li>Go to <a href="https://vercel.com" target="_blank">Vercel</a> → your project → Settings → Environment Variables</li>
          <li>Add a new variable: <code>GOOGLE_REFRESH_TOKEN</code> = the copied value</li>
          <li>Redeploy your project</li>
        </ol>
      </div>
    `), { headers: { 'Content-Type': 'text/html' } });

  } catch (err) {
    return new Response(renderPage('Error', `<p class="error">Something went wrong: ${err.message}</p>`), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function renderPage(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Daily Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 40px; max-width: 560px; width: 100%; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
    h3 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; }
    p { font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 12px; }
    a { color: #4f46e5; }
    .success { color: #16a34a; font-weight: 500; }
    .error { color: #dc2626; }
    .token-box { background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
    code { display: block; font-size: 12px; word-break: break-all; color: #1e1b4b; line-height: 1.5; margin-bottom: 12px; }
    button { background: #4f46e5; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; }
    button:hover { background: #4338ca; }
    ol { padding-left: 18px; font-size: 14px; color: #444; line-height: 2; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${content}
  </div>
</body>
</html>`;
}
