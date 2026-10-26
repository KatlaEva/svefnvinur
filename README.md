# Svefnvinur

A working MVP prototype of an Icelandic baby & child sleep-coaching app, built as an installable PWA. Parents log sleep, follow an age-appropriate daily rhythm, and get step-by-step help in the moment. It's designed to be used one-handed at night, next to a sleeping baby.

No backend, no login, no analytics. All data stays on the device.

## Run it

Requires Node 20.19+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| Command | What it does |
|---|---|
| `npm test` | Vitest unit tests (age, schedule, NÚNA state machine, progress) |
| `npm run contrast` | Checks every text/background token pair in both themes against WCAG AA |
| `npm run build` | Type-check + production build with service worker |
| `npm run preview` | Serve the production build (use this to test install/offline) |
| `npm run check` | contrast + tests + build in one go |
| `npm run icons` | Regenerate the PWA icons in `public/icons/` |

**Demo data:** in development, Meira → *Fyrir þróun* → *Sýnigögn* fills 14 days of logs for a 14-month-old. In a production build, open the app once with `?dev` in the URL to show that switch.

## File map

```
src/
  content/
    is.ts          ← ALL UI copy (Icelandic)
    advice.ts      ← ALL advice: schedules, rules, tips, safe sleep, help flows (DRAFT)
  config/
    coach.ts       ← coach name, photo, bio, email, phone, booking URL
  data/
    types.ts       ← data model
    store.ts       ← the only storage module (localStorage, versioned schema, import/export)
  lib/
    age.ts         ← age + corrected age, age bands, schedule lookup
    schedule.ts    ← builds today's plan (naps, bedtime, missed/short-nap adjustments, night window)
    now.ts         ← NÚNA state machine (pure function)
    progress.ts    ← per-day summaries, averages, plain-language insight
    seed.ts        ← demo data
    time.ts, format.ts
  AppContext.tsx   ← wires state, clock, plan, theme, reminders and NÚNA actions together
  screens/         ← Onboarding, Today, Help, HelpFlow, Progress, More
  components/      ← NowCard, Timeline, PlanCard, LogSheet, BarChart, BottomSheet, …
  styles.css       ← design tokens (day + night) and all styles
scripts/
  contrast.mjs     ← WCAG checker (reads tokens straight from styles.css)
  make-icons.mjs   ← dependency-free PNG icon generator
tests/             ← Vitest
```

## Where to edit things

- **Wording on any screen:** `src/content/is.ts`. Strings that include a name or number are small functions.
- **Sleep advice:** `src/content/advice.ts`. Plain data, no components involved:
  - `schedules`: naps, wake windows, nap length, total sleep and bedtime per age range
  - `rules`: routine length, short-nap threshold, how much bedtime moves after a missed or short nap, night-theme timing
  - `tips`, `safeSleep`, `doctorNote`, `disclaimer`
  - `helpFlows`: the five help flows, with steps per age band (`0-3m`, `4-6m`, `7-12m`, `1-2y`, `2-4y`, `4y+`). A step can have `waitMinutes` to show the wait ring.
- **Coach details:** `src/config/coach.ts`; replace `public/coach.svg` with a real photo.
- **Colours:** the token blocks at the top of `src/styles.css`. Run `npm run contrast` after any change.

## How the logic works

- **Plan day** runs 04:00–04:00, so a night belongs to the evening it started.
- **Schedule:** starts from the logged morning wake-up (or the usual wake time), walks through logged naps, then plans the remaining naps using wake windows that lengthen through the day. Naps that no longer fit before bedtime are dropped. Bedtime is clamped to the age range.
- **Missed/short naps:** opening *Við misstum af blundi* or *Blundurinn var of stuttur* records an adjustment for today. A logged nap under 40 minutes counts as short automatically. Each adjustment shortens the next wake window and moves bedtime earlier, but never more than 60 minutes before the usual earliest bedtime. Í dag shows the change and has an undo.
- **NÚNA** is a pure function of time, plan, logs and today's routine: night waking → nap → night → before wake-up → late evening → routine → nap due/upcoming → routine soon → awake.
- **Night theme:** automatic from 30 minutes before bedtime until wake-up, and whenever a night or night-waking timer is running. The moon button overrides it until the next automatic switch. Meira can set it to Always or Never.
- **Corrected age** is used for premature babies until 24 months of actual age.

## Assumptions and decisions

- **Accent colour for text:** `#5F7F63` on white is 4.47:1, just under AA. Buttons, links and active states therefore use a slightly deeper `--accent-ink: #4E6E52` (5.7:1). The original sage stays for non-text accents.
- **Chart colours:** the day chart uses a more saturated green/blue pair, which passes colour-blind separation checks. The night chart is amber/brown, because the night theme can't use blue. The two colours separate well, but they are less saturated than a standard chart palette. They always have a legend, and there's a hidden table for screen readers.
- **"Í rúmið"** (in bed) is recorded when the whole routine checklist has been ticked, or it can be entered in the sheet for a night sleep. If it's missing, Framfarir shows *Ekki skráð*.
- **Reminders** are local notifications and only fire while the app is open or in the background. Reminders with the app fully closed need web push, which needs a server.
- **Help flows for 4+** leave out the nap flows from the list, because there are no naps at that age.
- **Live timers** survive the app closing because a running timer is just a log with no end time.
- **Fonts** are self-hosted with `@fontsource`, so there are no external calls and they work offline.
- **Storage** is localStorage, not IndexedDB. The data is small and synchronous access keeps the store simple. Everything goes through `store.ts`, so this is easy to swap.

## What's next

1. **Backend + partner invites:** replace the internals of `store.ts` with a sync layer (e.g. Supabase) and add accounts so both parents share one child's log.
2. **Real coach content:** the coach reviews and rewrites `advice.ts` (marked DRAFT) and the coach details in `config/coach.ts`.
3. **App Store wrapper:** wrap with Capacitor for iOS/Android. This gives real scheduled notifications, haptics and store distribution.
4. Push reminders, chat or booking with the coach, multi-language support.

> Almennar ráðleggingar, koma ekki í stað læknisráða.
