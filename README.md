# Duolingo Streak Keeper & XP Automation

Never lose your streak again! This repository automatically completes daily practice lessons on Duolingo using GitHub Actions or locally from your machine, and includes a **Streak Reviver** tool to automatically backfill missed calendar days.

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

### Available Workflows

Once your `TOKEN` secret is added, go to the **Actions** tab on your GitHub repository:

| Workflow | Schedule / Trigger | Purpose |
| :--- | :--- | :--- |
| **Duolingo Streak Keeper** | Automatic daily (23:18 UTC) & Manual | Completes 1 lesson to protect and increment your streak. |
| **Duolingo Streak Reviver (Backfill)** | Manual (`Run workflow`) | Iterates day-by-day to complete backdated practice lessons for missed dates. |
| **Duolingo XP Farm** | Manual (`Run workflow`) | Earns XP by completing multiple practice lessons (customizable amount). |
| **Duolingo Periodic Practice** | Every 45 minutes & Manual | Regularly runs practice sessions throughout the day. |
| **Duolingo Unlimited Hearts** | Manual (`Run workflow`) | Attempts to enable classroom mode for unlimited hearts. |

To test immediately, go to **Actions** > **Duolingo Streak Keeper** > **Run workflow**.

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

# 2. Run the daily streak keeper / XP script
TOKEN="your_jwt_token_here" npm run xp

# 3. Complete multiple lessons
lessonsToComplete=5 TOKEN="your_jwt_token_here" npm run xp

# 4. Attempt unlimited hearts
TOKEN="your_jwt_token_here" npm run unlimitedhearts
```

---

### Troubleshooting
- **Session creation errors**: Duolingo tokens expire periodically (typically every few months). If lessons start failing, simply re-copy your `jwt_token` from your browser and update the `TOKEN` secret in your repository settings.
- **Multiple languages**: The script automatically detects the active language course you are studying (`learningLanguage` and `fromLanguage`) and practices that course.
