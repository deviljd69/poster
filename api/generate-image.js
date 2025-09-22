export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt, width = 1024, height = 1024 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });

    const url = `https://generativelanguage.googleapis.com/v1beta/images:generate?key=${encodeURIComponent(API_KEY)}`;
    const body = {
      prompt: { text: prompt },
      imageGenerationParams: { width, height }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).send(errText);
    }

    const data = await r.json();
    const base64 = data?.imageArtifacts?.[0]?.base64;
    if (!base64) return res.status(500).json({ error: 'No image returned' });

    return res.status(200).json({ base64 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}