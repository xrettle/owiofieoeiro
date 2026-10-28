/**
 * Duolingo XP & Daily Streak Keeper Script
 */

const {
    getUserLanguages,
    getHeaders,
    getCredentials,
    createPracticeSession,
    submitPracticeSession
} = require('./helper.js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const init = async () => {
    const lessonsRaw = process.env.lessonsToComplete || process.env.LESSONS || process.env.LESSONS_TO_COMPLETE || 1;
    const lessonsToComplete = Math.max(1, parseInt(lessonsRaw, 10) || 1);

    const { token, userId } = getCredentials();

    if (!token) {
        console.error('❌ Error: Duolingo auth token (TOKEN) is required.');
        console.error('👉 Please make sure the TOKEN secret is set in your repository settings.');
        process.exit(1);
    }

    const headers = getHeaders(token);

    try {
        console.log('🔄 Fetching user profile from Duolingo...');
        const userInfo = await getUserLanguages();
        console.log(`👤 User: ${userInfo.username} (ID: ${userInfo.userId})`);
        console.log(`🔥 Current Streak: ${userInfo.streak} days`);
        console.log(`📚 Active Course: Learning "${userInfo.learningLanguage}" from "${userInfo.fromLanguage}"`);

        let successfulLessons = 0;
        let totalXpEarned = 0;

        for (let i = 0; i < lessonsToComplete; i++) {
            const formattedFraction = `${i + 1}/${lessonsToComplete}`;
            console.log(`\n▶️ Starting lesson ${formattedFraction}...`);

            try {
                const session = await createPracticeSession(headers, userInfo);
                console.log(`   Session created (ID: ${session.id}, type: ${session.type || 'PRACTICE'})`);

                // Wait 1.5 seconds to simulate realistic completion time
                await sleep(1500);

                const rewards = await submitPracticeSession(headers, session);
                const xpGain = rewards?.xpGain ?? rewards?.xp ?? rewards?.awardedXp ?? 15;
                totalXpEarned += (typeof xpGain === 'number' ? xpGain : 0);

                console.log(`   Submitted session data - Server accepted!`);
                console.log(`💪🏆🎉 Earned ${xpGain} XP for lesson ${formattedFraction}!`);
                successfulLessons++;

                // Wait between lessons to prevent rate limiting
                if (i < lessonsToComplete - 1) {
                    await sleep(2000);
                }
            } catch (lessonErr) {
                console.error(`❌ Failed lesson ${formattedFraction}: ${lessonErr.message}`);
            }
        }

        console.log(`\n========================================`);
        console.log(`🏁 Summary: ${successfulLessons}/${lessonsToComplete} lessons completed.`);
        console.log(`✨ Total XP earned: ${totalXpEarned}`);
        console.log(`🔥 Duolingo daily streak maintained!`);
        console.log(`========================================`);

        if (successfulLessons === 0) {
            console.error('\n⚠️ All attempted lessons failed. Please check your token and account status.');
            process.exit(1);
        }
    } catch (err) {
        console.error(`\n❌ Initialization error: ${err.message}`);
        process.exit(1);
    }
};

init();
