/**
 * Duolingo Practice & Lesson Completion
 */

const {
    getUserLanguages,
    getHeaders,
    getCredentials,
    createPracticeSession,
    submitPracticeSession,
    parseDateUtc
} = require('./helper.js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Resolves an optional YYYY-MM-DD target date into a base UNIX timestamp (seconds).
 * Returns null if blank/omitted (meaning use today's live timestamp).
 */
function resolveTargetTimestamp(targetDateStr) {
    if (!targetDateStr || typeof targetDateStr !== 'string' || !targetDateStr.trim()) {
        return null;
    }
    const parsed = parseDateUtc(targetDateStr);
    if (!parsed) {
        throw new Error(`Invalid target date "${targetDateStr}". Expected YYYY-MM-DD (e.g. 2026-11-10).`);
    }
    return Math.floor(parsed.getTime() / 1000);
}

/**
 * Completes the specified number of practice lessons.
 *
 * @param {number|string} lessonsCount Number of lessons to complete (default: 1)
 * @param {string} [targetDateStr] Optional target date (YYYY-MM-DD); blank means today
 * @returns {Promise<{ successfulLessons: number, totalXpEarned: number, userInfo: object }>}
 */
async function completeLessons(lessonsCount = 1, targetDateStr = '') {
    const lessonsToComplete = Math.max(1, parseInt(lessonsCount, 10) || 1);
    const baseTargetTimestamp = resolveTargetTimestamp(targetDateStr);
    const { token } = getCredentials();

    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required.');
    }

    const headers = getHeaders(token);
    console.log('Fetching user profile from Duolingo...');
    const userInfo = await getUserLanguages();
    console.log(`User: ${userInfo.username} (ID: ${userInfo.userId})`);
    console.log(`Current Streak: ${userInfo.streak} days`);
    console.log(`Active Course: Learning "${userInfo.learningLanguage}" from "${userInfo.fromLanguage}"`);
    if (baseTargetTimestamp !== null) {
        console.log(`Target Date: ${targetDateStr.trim()} (adding XP to specified day)`);
    } else {
        console.log(`Target Date: Today`);
    }

    let successfulLessons = 0;
    let totalXpEarned = 0;

    for (let i = 0; i < lessonsToComplete; i++) {
        const formattedFraction = `${i + 1}/${lessonsToComplete}`;
        console.log(`\nStarting lesson ${formattedFraction}...`);

        try {
            const session = await createPracticeSession(headers, userInfo);
            console.log(`   Session created (ID: ${session.id}, type: ${session.type || 'PRACTICE'})`);

            // Pause before submitting the lesson
            await sleep(1500);

            // Spread multiple lessons slightly across the target day so timestamps are distinct
            const lessonTimestamp = baseTargetTimestamp !== null
                ? baseTargetTimestamp + (i * 120)
                : undefined;

            const rewards = await submitPracticeSession(headers, session, lessonTimestamp);
            const xpGain = rewards?.xpGain ?? rewards?.xp ?? rewards?.awardedXp ?? 15;
            totalXpEarned += (typeof xpGain === 'number' ? xpGain : 0);

            console.log(`   Submitted session data. Earned ${xpGain} XP for lesson ${formattedFraction}.`);
            successfulLessons++;

            // Wait between lessons to avoid rate limits
            if (i < lessonsToComplete - 1) {
                await sleep(2000);
            }
        } catch (lessonErr) {
            console.error(`Failed lesson ${formattedFraction}: ${lessonErr.message}`);
        }
    }

    console.log(`\n========================================`);
    console.log(`Summary: ${successfulLessons}/${lessonsToComplete} lessons completed.`);
    console.log(`Total XP earned: ${totalXpEarned}`);
    console.log(`========================================`);

    if (successfulLessons === 0) {
        throw new Error('All attempted lessons failed. Please check your token and account status.');
    }

    return {
        successfulLessons,
        totalXpEarned,
        userInfo
    };
}

if (require.main === module) {
    const lessonsRaw = process.env.lessonsToComplete || process.env.LESSONS || process.env.LESSONS_TO_COMPLETE || 1;
    const targetDateRaw = process.env.TARGET_DATE || process.env.targetDate || process.env.DATE || '';
    completeLessons(lessonsRaw, targetDateRaw).catch(err => {
        console.error(`\nError: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    completeLessons,
    resolveTargetTimestamp,
    sleep
};
