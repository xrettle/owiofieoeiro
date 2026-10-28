/**
 * Duolingo Historical Streak Reviver & Backfill Tool
 *
 * Simulates completing lessons backdated day-by-day to fill missed gaps
 * in your streak calendar from your previous streak up to the present.
 */

const {
    getUserLanguages,
    getHeaders,
    getCredentials,
    createPracticeSession,
    submitPracticeSession
} = require('./helper.js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parses YYYY-MM-DD into a UTC Date object at noon (12:00:00 UTC)
 */
function parseDateUtc(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return null;
    const trimmed = dateStr.trim();
    const parts = trimmed.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const d = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
            if (!isNaN(d.getTime())) return d;
        }
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        d.setUTCHours(12, 0, 0, 0);
        return d;
    }
    return null;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
function formatDateUtc(d) {
    return d.toISOString().split('T')[0];
}

/**
 * Generates an array of daily UTC Dates from start to end (inclusive)
 */
function generateDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate.getTime());
    current.setUTCHours(12, 0, 0, 0);

    const end = new Date(endDate.getTime());
    end.setUTCHours(12, 0, 0, 0);

    while (current <= end) {
        dates.push(new Date(current.getTime()));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

const main = async () => {
    const { token, userId } = getCredentials();

    if (!token) {
        console.error('❌ Error: Duolingo auth token (TOKEN) is required.');
        process.exit(1);
    }

    const headers = getHeaders(token);

    try {
        console.log('🔄 Fetching user profile and streak history from Duolingo...');
        const userInfo = await getUserLanguages();
        console.log(`👤 User: ${userInfo.username} (ID: ${userInfo.userId})`);
        console.log(`🔥 Current Streak: ${userInfo.streak} days`);
        console.log(`📚 Active Course: Learning "${userInfo.learningLanguage}" from "${userInfo.fromLanguage}"`);

        const streakData = userInfo.streakData || {};
        if (streakData.previousStreak) {
            console.log(`📜 Previous Streak: ${streakData.previousStreak.length || 'N/A'} days (ended: ${streakData.previousStreak.endDate || 'unknown'})`);
        }
        if (streakData.currentStreak) {
            console.log(`📈 Ongoing Streak: ${streakData.currentStreak.length || 'N/A'} days (started: ${streakData.currentStreak.startDate || 'unknown'})`);
        }

        // Determine start and end dates
        const nowUtc = new Date();
        nowUtc.setUTCHours(12, 0, 0, 0);

        let startDate = null;
        let endDate = parseDateUtc(process.env.END_DATE) || nowUtc;

        if (process.env.START_DATE && process.env.START_DATE.trim()) {
            startDate = parseDateUtc(process.env.START_DATE);
            if (!startDate) {
                console.error(`❌ Invalid START_DATE format: "${process.env.START_DATE}". Expected YYYY-MM-DD.`);
                process.exit(1);
            }
        } else if (process.env.DAYS_BACK && process.env.DAYS_BACK.trim()) {
            const daysBack = parseInt(process.env.DAYS_BACK.trim(), 10);
            if (daysBack > 0) {
                startDate = new Date(endDate.getTime());
                startDate.setUTCDate(startDate.getUTCDate() - daysBack);
            }
        } else if (streakData.previousStreak && streakData.previousStreak.endDate) {
            console.log(`\n💡 Auto-detected gap: Starting from the day after your previous streak ended (${streakData.previousStreak.endDate}).`);
            const prevEnd = parseDateUtc(streakData.previousStreak.endDate);
            if (prevEnd) {
                startDate = new Date(prevEnd.getTime());
                startDate.setUTCDate(startDate.getUTCDate() + 1);
            }
        }

        // Fallback default: 7 days back if nothing specified
        if (!startDate) {
            console.log('\n💡 No START_DATE or DAYS_BACK specified. Defaulting to the past 7 days.');
            console.log('   (To customize, set START_DATE=YYYY-MM-DD or DAYS_BACK=30)');
            startDate = new Date(endDate.getTime());
            startDate.setUTCDate(startDate.getUTCDate() - 7);
        }

        if (startDate > endDate) {
            console.error(`❌ START_DATE (${formatDateUtc(startDate)}) cannot be after END_DATE (${formatDateUtc(endDate)}).`);
            process.exit(1);
        }

        const dateList = generateDateRange(startDate, endDate);
        console.log(`\n📅 Backfill Range: ${formatDateUtc(startDate)} to ${formatDateUtc(endDate)} (${dateList.length} total days)`);
        console.log('🚀 Starting backfill loop...\n');

        let successfulDays = 0;
        let failedDays = 0;
        let totalXp = 0;

        for (let i = 0; i < dateList.length; i++) {
            const targetDate = dateList[i];
            const dateStr = formatDateUtc(targetDate);
            const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
            const progress = `[${i + 1}/${dateList.length}]`;

            console.log(`${progress} Backfilling for date: ${dateStr}...`);

            try {
                // 1. Create a practice session
                const session = await createPracticeSession(headers, userInfo);

                // Wait 1 second
                await sleep(1000);

                // 2. Submit session with backdated target timestamp
                const rewards = await submitPracticeSession(headers, session, targetTimestamp);
                const xpGain = rewards?.xpGain ?? rewards?.xp ?? rewards?.awardedXp ?? 15;
                totalXp += (typeof xpGain === 'number' ? xpGain : 0);

                console.log(`   ✅ Success! Completed lesson for ${dateStr} (+${xpGain} XP)`);
                successfulDays++;

                // Wait 1.5 seconds between requests to avoid rate limiting
                if (i < dateList.length - 1) {
                    await sleep(1500);
                }
            } catch (err) {
                console.error(`   ❌ Failed for ${dateStr}: ${err.message}`);
                failedDays++;
            }
        }

        console.log('\n========================================');
        console.log('🏁 Backfill Process Finished!');
        console.log(`📅 Days attempted: ${dateList.length}`);
        console.log(`✅ Successful days: ${successfulDays}`);
        console.log(`❌ Failed days: ${failedDays}`);
        console.log(`✨ Total XP earned: ${totalXp}`);
        console.log('========================================');

        // Check updated status
        console.log('\n🔄 Checking updated profile data...');
        try {
            const updated = await getUserLanguages();
            console.log(`🔥 Updated Streak: ${updated.streak} days`);
        } catch (e) {
            // Ignore if refresh fails
        }

    } catch (err) {
        console.error(`\n❌ Error during streak revival: ${err.message}`);
        process.exit(1);
    }
};

main();
