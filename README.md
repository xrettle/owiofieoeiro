# Duolingo Streak Keeper & XP Automation

Never lose your streak again! This repository automatically completes daily practice lessons on Duolingo using GitHub Actions or locally from your machine, complete with **intelligent human-like randomized timing** and a **Streak Reviver** tool to automatically backfill missed calendar days.

---

### Setup Guide (Fast & Simple)

You only need **one** secret: your **Duolingo Auth Token**. The script automatically decodes your numeric User ID directly from your token, so you don't even need to configure `USER_ID`!

#### Step 1: Copy your Duolingo Auth Token
1. Open [duolingo.com](https://www.duolingo.com) and log in to your account.
2. Open your browser's Developer Tools Console (`F12`, or `Option + Command + J` on Mac / `Ctrl + Shift + J` on Windows).
3. Paste the following snippet and press **Enter**:
   ```javascript
   document.cookie
     .split('; ')
     .find(row => row.startsWith('jwt_token='))
     ?.split('=')[1];
   ```
4. Copy the output string (without quotes).

#### Step 2: Add your Token to GitHub Secrets
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Set the name to:
   ```
   TOKEN
   ```
5. Paste your token into the **Secret** field and click **Add secret**.

*(Optional)* If you already added a `USER_ID` secret in the past, no worries—the script automatically detects if it was an old UUID and safely overrides it with your authenticated account ID!

---

### Intelligent Randomized Streak Keeper

Instead of running at the exact same fixed minute every day (which can easily be flagged as an automated bot), the Streak Keeper operates like a real human:

#### Active Time Slots
Each day, the scheduler randomly chooses **one** of three realistic daily active windows, and within that window, chooses a **random minute & second**:

1. **Morning Slot:** `6:40 AM – 7:30 AM`
2. **Afternoon Slot:** `5:00 PM – 6:30 PM`
3. **Evening Slot:** `8:15 PM – 8:50 PM`

#### How It Works:
- **Randomized Timing:** Every day gets a completely different time slot and a different minute.
- **Smart Skip:** If you already practiced on your phone earlier in the day, the script detects it from Duolingo and exits cleanly without running an extra lesson.
- **Failsafe Streak Guarantee:** If an earlier scheduled slot was missed (e.g. temporary GitHub Actions outage), the final evening slot detects that today's lesson is still incomplete and runs as a failsafe to guarantee your streak is never lost.
- **Timezone Support:** Defaults to `America/Los_Angeles` (Pacific Time). You can customize this by setting a repository variable `TIMEZONE` (e.g. `America/New_York` or `Europe/London`).

---

### League Checker & Demotion Defense

Never get demoted from your Duolingo League again! The League Checker monitors your competitive standing and protects you automatically:

#### Key Capabilities:
- **Comprehensive League Inspection:** Detects your League tier (Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, or Diamond), current rank, user XP, and displays an ASCII table of your cohort's XP standings.
- **Zone Awareness:** Automatically identifies whether you are in the **Promotion Zone**, **Safe Zone**, or **Demotion Zone** (based on tier rulesets and cohort size).
- **Automated Demotion Defense:** If you fall into the demotion zone, it automatically grinds lessons until you reach **at least 5th place** (keeping you safely between **1st and 9th place**).
- **Human-like Pacing (Anti-Detection):** To look completely natural and prevent API rate-limiting or bot detection, it waits a **randomized pause of 1 to 2 minutes (60–120 seconds)** between each lesson completed.
- **Seamless Streak Keeper Integration:** The League Checker automatically runs alongside the Streak Keeper during its randomized daily time slots (Morning, Afternoon, and Evening), so your league rank is continually audited and defended throughout the day.
- **Toggle Control:** Enabled by default. You can disable it at any time by setting `LEAGUE_CHECKER=false`.

---

### Available Workflows

Once your `TOKEN` secret is added, go to the **Actions** tab on your GitHub repository:

| Workflow | Schedule / Trigger | Purpose |
| :--- | :--- | :--- |
| **Duolingo Streak Keeper** | Automated across daily random slots | Completes 1 lesson at a random time within your active time slots and defends your League rank. |
| **Duolingo League Checker** | Manual (`Run workflow`) | Checks your league rank/demotion zone and grinds to top 5 if in demotion danger. |
| **Duolingo Streak Reviver (Backfill)** | Manual (`Run workflow`) | Iterates day-by-day to complete backdated practice lessons for missed dates. |
| **Duolingo XP Farm** | Manual (`Run workflow`) | Earns XP by completing multiple practice lessons (customizable amount). |
| **Duolingo Periodic Practice** | Every 45 minutes & Manual | Regularly runs practice sessions throughout the day. |
| **Duolingo Unlimited Hearts** | Manual (`Run workflow`) | Attempts to enable classroom mode for unlimited hearts. |

To test immediately, go to **Actions** > **Duolingo Streak Keeper** > **Run workflow** (default mode `immediate` runs right away).

---

### Historical Streak Reviver (Backfill Loop)

If you had a broken streak and want to attempt to fill in the missed calendar days:

#### In GitHub Actions:
1. Go to **Actions** > **Duolingo Streak Reviver (Backfill)**.
2. Click **Run workflow**.
3. You can optionally enter:
   - `startDate`: The date you want to start backfilling from (format: `YYYY-MM-DD`). *If left blank, the script auto-detects when your previous streak ended and starts from there!*
   - `endDate`: The end date (defaults to today).
   - `daysBack`: Alternative to entering dates (e.g. `30` to backfill the last 30 days).

#### Running Locally:
```bash
# Auto-detect gap from your previous streak and backfill to today:
TOKEN="your_jwt_token_here" npm run revive

# Or specify a custom start date:
START_DATE="2024-05-20" TOKEN="your_jwt_token_here" npm run revive

# Or specify a number of past days to cover:
DAYS_BACK=14 TOKEN="your_jwt_token_here" npm run revive
```

---

### Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Inspect today's scheduled slot and status (dry-run):
TOKEN="your_jwt_token_here" MODE=check npm run streak

# 3. Run the streak keeper immediately:
TOKEN="your_jwt_token_here" MODE=immediate npm run streak

# 4. Run the league checker & demotion defense:
TOKEN="your_jwt_token_here" npm run league

# 5. Farm XP (complete multiple lessons):
lessonsToComplete=5 TOKEN="your_jwt_token_here" npm run xp

# 6. Attempt unlimited hearts:
TOKEN="your_jwt_token_here" npm run unlimitedhearts
```

---

### Troubleshooting
- **Session creation errors**: Duolingo tokens expire periodically (typically every few months). If lessons start failing, simply re-copy your `jwt_token` from your browser and update the `TOKEN` secret in your repository settings.
- **Multiple languages**: The script automatically detects the active language course you are studying (`learningLanguage` and `fromLanguage`) and practices that course.
