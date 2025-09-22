async function refinePromptIfEnabled(prompt) {
  if (!refineToggle.checked) return prompt;
  const res = await fetch('/api/refine-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(await res.text());
  const { refined } = await res.json();
  return `${refined}\n\nNo text, no watermarks, no logos.`;
}

async function generateImage(prompt, width, height) {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width, height })
  });
  if (!res.ok) throw new Error(await res.text());
  const { base64 } = await res.json();
  return `data:image/png;base64,${base64}`;
}