# BLCNYY

The personal website for Ömer Balkan, built with Next.js.

The site is available in English (at the root) and Turkish (under `/tr`); the EN/TR button next to the navigation switches between the same page in each language. The top navigation has three items:

- **Explore** is a scene-based profile controlled by wheel, trackpad, touch, or keyboard input: identity, introduction, story, one scene per project (Duly, Salah[Now]), Instagram, latest articles, and Ask.
- **Writing** lists every article. Articles load from Notion and can be read in any language that has a `Content (XX)` property.
- **Ask** is an AI profile grounded in the public information stored in the codebase and powered by OpenRouter. It keeps the last few turns for follow-up questions and can read answers aloud.

When the Notion variables are missing, a small built-in preview set keeps the Explore article grid populated and each preview opens a short placeholder page. When Notion is configured but a request fails, the error is thrown so incremental revalidation keeps serving the last good page.

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

- `/` and `/tr` — Explore
- `/ask` and `/tr/ask` — AI profile (answers in Turkish on the Turkish site)
- `/blog` and `/tr/blog` — all articles (Writing)
- `/blog/[slug]` and `/tr/blog/[slug]` — article reader that opens in the site language when available, with a language switcher (`?lang=tr` opens a specific language)
- `/sitemap.xml` and `/robots.txt` — generated from the published articles

## Main files

- `src/components/explore-experience.tsx` — discrete scene navigation and content presentation
- `src/components/site-navigation.tsx` — shared Explore / Writing / Ask navigation
- `src/components/article-reader.tsx` — article header and language switcher
- `src/components/post-rich-content.tsx` — Notion rich text and block rendering
- `src/components/chat-shell.tsx` — Ask interface
- `src/lib/blcnyy-profile.ts` — public profile facts used by the AI
- `src/lib/explore-content.ts` — English and Turkish Explore story, projects, and article fallbacks
- `src/lib/dictionaries.ts` — English and Turkish interface strings
- `src/lib/i18n.ts` — locale helpers (`localizePath`, `hreflang` alternates)
- `src/components/pages/` — page components shared by the English and Turkish routes
- `src/lib/notion.ts` — Notion article loading
- `src/lib/site.ts` — canonical URL, social links, and shared metadata

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
ANSWER_SIGNING_SECRET=
NOTION_TOKEN=your-token-here
NOTION_DATABASE_ID=your-database-id-here
```

Only `OPENROUTER_API_KEY` is required for Ask. The Notion variables are required for complete article listings and article pages.

- `PROFILE_PRIVATE_CONTEXT` — Optional plain text appended under "Additional Profile Context" for the assistant; these facts may appear in Ask answers.
- `PROFILE_BIRTH_DATE` — Optional birth date in `YYYY-MM-DD` format, used to calculate the profile owner's current age.
- `ANSWER_SIGNING_SECRET` — Optional secret for signing Ask answers. Only signed answers can be read aloud or sent back as follow-up context. When unset, a key derived from `OPENROUTER_API_KEY` is used.

Set these profile variables on your deployment or in an uncommitted `.env.local` file.

## License and personal content

The code is licensed under the [MIT License](LICENSE). The profile content, Ömer Balkan's name, BLCNYY branding, and avatar are excluded from that license. If you fork this project, replace `src/lib/blcnyy-profile.ts` with your own data and use your own name, branding, and avatar.
