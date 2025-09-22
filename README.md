# Cinematic Poster Generator (Vercel + Google AI Studio)

Static frontend + Vercel Serverless Functions for secure Google AI calls.

## Files
- index.html
- css/styles.css
- js/app.js
- api/generate-image.js
- api/refine-prompt.js

## Environment Variables (Vercel)
- In Vercel → Project → Settings → Environment Variables:
  - Name: GOOGLE_API_KEY
  - Value: YOUR_GOOGLE_AI_STUDIO_API_KEY
  - Environments: Production (and Preview if needed)
- Do not commit a `.env` for production.

## Local Dev (optional)
- Install Vercel CLI: `npm i -g vercel`
- Create `.env.local` (not committed):