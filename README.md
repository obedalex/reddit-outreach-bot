# Reddit Outreach Lead Bot 🚀

[![Platform](https://img.shields.io/badge/Platform-Reddit%20Devvit-FF4500?logo=reddit&logoColor=white)](https://developers.reddit.com/)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Framework](https://img.shields.io/badge/Framework-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)

An automated, intelligent lead generation and outreach assistant for Reddit. Built on the **Reddit Developer Platform (Devvit)** using the **Hono** web framework, this bot scans prospective subreddits for high-intent keywords to identify users who need web development services, deduplicates prospective leads using an embedded Redis cache, and safely initiates outreach via Direct Messages with built-in rate-limit safe delays.

---

## ⚙️ How the Bot Works

Every **2 hours**, the native Reddit Devvit scheduler triggers an automated cron task targeting the `/internal/scheduler/check-gigs` endpoint.

```mermaid
graph TD
    Start([Cron Triggered every 2 hours]) --> SubList[Assemble & Deduplicate Subreddit List]
    SubList --> LoopSubs{For Each Subreddit}

    LoopSubs -- Done --> End([Outreach Completed])
    LoopSubs -- Next Subreddit --> FetchPosts[Fetch 25 Newest Posts]

    FetchPosts --> LoopPosts{For Each Post}
    LoopPosts -- Done --> LoopSubs
    LoopPosts -- Next Post --> ScanPost{Scan Title & Body for Keywords}

    ScanPost -- Match Found --> PostAuthor{Author Valid & Not [deleted]?}
    PostAuthor -- Yes --> PostRedisCheck{ID in Redis Cache?}
    PostRedisCheck -- No --> PostDelay[Random Delay 2-5s]
    PostDelay --> PostDM[Send Outreach DM]
    PostDM --> PostCache[Save Post ID to Redis 30-Day TTL]
    PostCache --> ScanComments

    ScanPost -- No Match --> ScanComments{Has Comments?}
    PostAuthor -- No --> ScanComments
    PostRedisCheck -- Yes --> ScanComments

    ScanComments -- Yes --> FetchComments[Fetch 10 Newest Comments]
    ScanComments -- No --> LoopPosts

    FetchComments --> LoopComments{For Each Comment}
    LoopComments -- Done --> LoopPosts
    LoopComments -- Next Comment --> ScanComment{Scan Body for Keywords}

    ScanComment -- Match Found --> CommAuthor{Author Valid & Not [deleted]?}
    CommAuthor -- Yes --> CommRedisCheck{ID in Redis Cache?}
    CommRedisCheck -- No --> CommDelay[Random Delay 2-5s]
    CommDelay --> CommDM[Send Outreach DM]
    CommDM --> CommCache[Save Comment ID to Redis 30-Day TTL]
    CommCache --> LoopComments

    ScanComment -- No Match --> LoopComments
    CommAuthor -- No --> LoopComments
    CommRedisCheck -- Yes --> LoopComments
```

---

## 🛠️ Features

- 🕵️ **Dual Scanning**: Scans both newly published post titles/bodies AND active thread comments for maximum coverage.
- ⚡ **Hono Framework Integration**: Leverages `hono` router inside the Reddit Devvit environment for clean routing, handlers, and triggers.
- 🗄️ **Redis-backed Deduplication**: Automatically caches processed post/comment IDs for 30 days in the built-in Reddit Redis database, guaranteeing you never double-message the same lead.
- ⏱️ **Rate-Limiting Protection**: Implements a randomized 2 to 5-second staggered pause between DMs to conform to Reddit API boundaries and avoid bot-detection flags.
- 🛠️ **Moderator UI Integration**: Exposes a custom Mod Menu action directly in the Reddit interface for instant, manual, on-demand execution.

---

## 🚀 Playbook: Setup, Running & Verification

Follow this workflow to run, test, and verify the bot locally and prepare it for live production.

### Prerequisites

- **Node.js**: Version `>=22.2.0` (as required by modern Devvit environments).
- **Reddit Account**: A Reddit developer account with moderator access to a sandbox subreddit for testing.
- **Devvit CLI**: Standard Reddit developer environment tools.

### 1. Installation

Clone the repository and install all dependencies:

```bash
npm install
```

### 2. Authentication

Authenticate your local environment with the Reddit Devvit platform:

```bash
npm run login
```

Follow the browser prompts to authorize your terminal CLI with your Reddit account.

---

### 3. Local Development & Playtesting (Subreddit Mod Menu)

Since Devvit operates on a hosted serverless environment directly on Reddit, you cannot test it using standard local ports (e.g. `localhost` or `curl`). Instead, we leverage **Reddit Playtesting**.

1. **Start Playtest Session**:
   Launch the watch session which automatically builds and uploads your code to the hosted playtest subreddit:

   ```bash
   npm run dev
   ```

   _Note: This targets your development playtest subreddit specified in `devvit.json` (defaults to `r/outreach_bot_dev`)._

2. **Trigger Manually via Reddit UI**:
   - Open your playtest subreddit in a browser: `https://www.reddit.com/r/outreach_bot_dev/?playtest=outreach-bot`
   - Open the **Subreddit Moderator Tools / Community Options** menu.
   - Click the newly registered custom action: **"Trigger Gig Check"**.

3. **Monitor Live Playtest Logs**:
   A toast notification (`🚀 Gig check completed successfully!`) will appear in your browser, and you will see real-time output in your playtest terminal:
   ```text
   🚀 Running native SDK gig check at 2026-05-21T18:20:00.000Z
   Scanning r/all...
   Scanning r/forhire...
   ✅ Sent "Hi" to [username] for matching post (Keyword: "need website"): "need website for e-commerce store"
   ✅ Gig check completed
   ```

---

### 4. Deploying to Production (Sandbox Subreddit)

Once local validation succeeds, deploy it to a private sandbox subreddit to verify long-term scheduling and real-world execution:

1. **Create a Private Subreddit**:
   Create a new community on Reddit (e.g. `r/mygigbotprivate`) and set it to **Private** for safety.

2. **Upload/Publish the App**:
   Run the deployment script to check types, lint, and upload the build bundle safely to Reddit's Devvit platform:

   ```bash
   npm run deploy
   ```

3. **Install the App**:
   Install your uploaded application on your private moderator sandbox:

   ```bash
   npx devvit install r/mygigbotprivate
   ```

4. **Verify Active Logs**:
   Ensure scheduled cron jobs are firing correctly by monitoring remote console logs in real time:
   ```bash
   npx devvit logs r/mygigbotprivate
   ```

---

## ⚙️ Customization Playbook

The bot is designed to be easily tailored to your specific business niche, target audience, or industry.

### Subreddits to Target

To expand or restrict the subreddits scanned by the bot, update the `SUBREDDITS` array in [src/routes/scheduler.ts](file:///Users/mac/outreach-bot/src/routes/scheduler.ts#L6-L15):

```typescript
const SUBREDDITS = [
  'all',
  'forhire',
  'freelance',
  'webdev',
  'webdesign',
  'Entrepreneur',
  'NoStupidQuestions',
  'website',
];
```

### Search Keywords

To target a different niche (e.g., Copywriting, SEO, Mobile Apps), update the `SEARCH_TERMS` array in [src/routes/scheduler.ts](file:///Users/mac/outreach-bot/src/routes/scheduler.ts#L17-L23):

```typescript
const SEARCH_TERMS = [
  'need website',
  'need a website',
  'need site',
  'build website',
  'make me a website',
];
```

### Outreach Message Body

To customize the Direct Message subject line and text sent to your leads, adjust the `reddit.sendPrivateMessage` configuration in [src/routes/scheduler.ts](file:///Users/mac/outreach-bot/src/routes/scheduler.ts#L85-L89) (and similarly in comment outreach around line 140):

```typescript
await reddit.sendPrivateMessage({
  to: author,
  subject: 'Your Subject Line Here',
  text: 'Hello! I noticed your post regarding...',
});
```

### Cron Frequency

To change how often the scheduler runs, modify the cron format in [devvit.json](file:///Users/mac/outreach-bot/devvit.json#L24-L27):

```json
"tasks": {
  "check-gigs-every-2-hours": {
    "endpoint": "/internal/scheduler/check-gigs",
    "cron": "0 */2 * * *" // Runs every 2 hours. Change to "0 * * * *" for hourly
  }
}
```

---

## 🔒 Safety, Compliance & Best Practices

> [!WARNING]  
> **Direct Message & Rate Limits**: Reddit enforces strict system-wide restrictions on outbound Direct Messages, particularly from newly created accounts. Outbound volume triggers can lead to automatic shadowbans or account suspensions if guidelines are breached.

To keep your bot safe, always adhere to the following principles:

1. **Warm Up Your Bot Account**: Never run this bot from a fresh Reddit account. Use a mature Reddit account that has established karma, history, and active usage.
2. **Increase Message Staggering**: Under strict enforcement, you can expand the random delay range in [src/routes/scheduler.ts](file:///Users/mac/outreach-bot/src/routes/scheduler.ts#L81) from `2000-5000ms` to `10000-30000ms` (10-30 seconds) to simulate natural human typing speeds.
3. **Respect Opt-Outs**: If a user replies asking not to be messaged again, manually blacklist them or respect their privacy immediately.
4. **Limit Niche Scope**: Keep search queries highly specific to avoid false-positive matches, and limit subreddit scans to target active communities rather than broad catch-all groups.

---

## 🤝 Contributing

Contributions are highly welcome! To make sure your additions are accepted smoothly, please follow these quality assurance steps:

1. **Linting**:
   ```bash
   npm run lint
   ```
2. **Formatting**:
   ```bash
   npm run prettier
   ```
3. **Type-Checking**:
   ```bash
   npm run type-check
   ```

_Ensure your changes do not violate TypeScript's `strict: true` compile settings before opening a pull request._

---

## 📄 License

This project is licensed under the **BSD 3-Clause License** - see the [LICENSE](file:///Users/mac/outreach-bot/LICENSE) file for details.
