// api/refine-prompt.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(API_KEY)}`;
    const body = {
      contents: [
        { role: 'user', parts: [{ text: `Refine this prompt for text-to-image. Return only the improved prompt, no commentary:\n\n${prompt}` }] }
      ]
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
    const refined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!refined) return res.status(500).json({ error: 'No refinement returned' });

    return res.status(200).json({ refined });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}