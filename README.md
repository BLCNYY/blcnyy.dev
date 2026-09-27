# BLCNYY

The personal website for Ömer Balkan, built with Next.js.

The site has two primary experiences:

- **Explore** is a six-scene profile controlled by wheel, trackpad, touch, or keyboard input.
- **Ask** is an AI profile grounded in the public information stored in the codebase and powered by OpenRouter.

Published articles are loaded from Notion. A small built-in preview set keeps the Explore article grid populated when Notion is unavailable.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the OpenRouter and Notion credentials you want to use.
3. Install dependencies and start the development server.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — Explore
- `/ask` — AI profile
- `/blog` — all articles
- `/blog/[slug]` — article reader

## Main files

- `src/components/explore-experience.tsx` — discrete scene navigation and content presentation
- `src/components/site-navigation.tsx` — shared Explore / Ask navigation
- `src/components/chat-shell.tsx` — Ask interface
- `src/lib/blcnyy-profile.ts` — public profile facts used by the AI
- `src/lib/explore-content.ts` — curated Explore story, projects, and article fallbacks
- `src/lib/notion.ts` — Notion article loading

## Environment variables

```bash
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=google/gemini-3.8-flash
OPENROUTER_TTS_MODEL=google/gemini-3.1-flash-tts-preview
OPENROUTER_TTS_VOICE=Zephyr
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=BLCNYY
PROFILE_PRIVATE_CONTEXT=
PROFILE_BIRTH_DATE=
NOTION_TOKEN=your-token-here
NOTION_DATABASE_ID=your-database-id-here
```

Only `OPENROUTER_API_KEY` is required for Ask. The Notion variables are required for complete article listings and article pages.

- `PROFILE_PRIVATE_CONTEXT` — Optional plain text appended under "Additional Profile Context" for the assistant; these facts may appear in Ask answers.
- `PROFILE_BIRTH_DATE` — Optional birth date in `YYYY-MM-DD` format, used to calculate the profile owner's current age.

Set these profile variables on your deployment or in an uncommitted `.env.local` file.

## License and personal content

The code is licensed under the [MIT License](LICENSE). The profile content, Ömer Balkan's name, BLCNYY branding, and avatar are excluded from that license. If you fork this project, replace `src/lib/blcnyy-profile.ts` with your own data and use your own name, branding, and avatar.
