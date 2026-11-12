/**
 * Duolingo League Checker
 *
 * Checks your Duolingo league tier, rank, promotion/demotion zone, and
 * competitors' XP. If you are in the demotion zone, it runs practice lessons
 * spaced 1-2 minutes apart until you reach at least 5th place.
 */

const {
    getCredentials,
    getHeaders,
    getUserLanguages,
    createPracticeSession,
    submitPracticeSession,
    getLeaderboardStatus
} = require('./helper.js');
const { sleep } = require('./xp.js');

/**
 * Returns a random delay in milliseconds between minSec and maxSec (default 60s - 120s)
 */
function getRandomDelay(minSec = 60, maxSec = 120) {
    const minMs = Math.max(1, minSec) * 1000;
    const maxMs = Math.max(minMs, maxSec * 1000);
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

/**
 * Generates an ASCII table summarizing current leaderboard standings
 */
function formatLeaderboardTable(status) {
    if (!status || !status.hasActiveCohort || !Array.isArray(status.rankings)) {
        return 'No active cohort rankings available.';
    }

    const lines = [];
    lines.push(`+------+--------------------------------+---------+--------------------+`);
    lines.push(`| Rank | User                           | XP      | Zone Status        |`);
    lines.push(`+------+--------------------------------+---------+--------------------+`);

    const rankings = status.rankings;
    const totalUsers = rankings.length;
    const userRank = status.currentRank;

    // Display top 5, user's neighbors, and bottom 3
    const displayIndices = new Set();
    for (let i = 0; i < Math.min(5, totalUsers); i++) displayIndices.add(i);
    if (userRank) {
        for (let i = Math.max(0, userRank - 2); i <= Math.min(totalUsers - 1, userRank); i++) {
            displayIndices.add(i);
        }
    }
    for (let i = Math.max(0, totalUsers - 3); i < totalUsers; i++) displayIndices.add(i);

    const sortedIndices = Array.from(displayIndices).sort((a, b) => a - b);
    let prevIndex = -1;

    for (const idx of sortedIndices) {
        if (prevIndex !== -1 && idx > prevIndex + 1) {
            lines.push(`| ...  | ...                            | ...     | ...                |`);
        }
        prevIndex = idx;

        const r = rankings[idx];
        const isUser = r.isCurrentUser;
        const rankStr = String(r.rank).padStart(3, ' ');
        const nameRaw = (isUser ? `${r.displayName} (YOU)` : r.displayName).slice(0, 30);
        const nameStr = nameRaw.padEnd(30, ' ');
        const scoreStr = String(r.score).padStart(6, ' ') + ' ';

        let zoneStr = 'Safe Zone';
        if (status.promotionCutoffRank && r.rank <= status.promotionCutoffRank) {
            zoneStr = r.rank === 1 ? '1st Place' : (r.rank <= 3 ? 'Top 3' : 'Promotion');
        } else if (status.demotionCutoffRank && r.rank >= status.demotionCutoffRank) {
            zoneStr = 'DEMOTION';
        }
        if (r.rank === 5) {
            zoneStr += ' (Target)';
        }
        const formattedZone = zoneStr.padEnd(18, ' ');

        lines.push(`| ${rankStr}  | ${nameStr} | ${scoreStr} | ${formattedZone} |`);
    }

    lines.push(`+------+--------------------------------+---------+--------------------+`);
    return lines.join('\n');
}

/**
 * Checks Duolingo league standings and defends from demotion if necessary
 *
 * @param {object} options
 * @param {number} [options.targetRank=5] Target rank to reach (default 5th place)
 * @param {number} [options.minDelaySec=60] Minimum pause between lessons in seconds (default: 60)
 * @param {number} [options.maxDelaySec=120] Maximum pause between lessons in seconds (default: 120)
 * @param {number} [options.maxLessons=25] Max lessons safety cap per execution
 * @param {boolean} [options.dryRun=false] Inspection only without completing lessons
 * @returns {Promise<object>} Execution result
 */
async function checkAndDefendLeague(options = {}) {
    const targetRank = Math.max(1, parseInt(options.targetRank, 10) || 5);
    const minDelaySec = Math.max(1, parseInt(options.minDelaySec, 10) || 60);
    const maxDelaySec = Math.max(minDelaySec, parseInt(options.maxDelaySec, 10) || 120);
    const maxLessons = Math.max(1, parseInt(options.maxLessons || process.env.MAX_LEAGUE_LESSONS, 10) || 25);
    const dryRun = Boolean(options.dryRun);

    const { token, userId } = getCredentials();
    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required.');
    }

    console.log(`\n====================================================`);
    console.log(`Duolingo League Checker`);
    console.log(`====================================================`);

    console.log(`Fetching league data from Duolingo...`);
    let status;
    try {
        status = await getLeaderboardStatus(token, userId);
    } catch (err) {
        console.warn(`Warning: Could not fetch leaderboard data: ${err.message}`);
        return { checked: false, error: err.message };
    }

    console.log(`League Tier: ${status.leagueName} (Tier ${status.tier})`);
    if (status.streakInTier > 0) {
        console.log(`Streak in Tier: ${status.streakInTier} weeks`);
    }
    if (status.contestEnd) {
        console.log(`Contest Ends: ${status.contestEnd.toUTCString()}`);
    }

    if (!status.hasActiveCohort) {
        console.log(`\nYou are not in an active weekly cohort yet.`);
        console.log(`   (Duolingo places you into a cohort after your first lesson of the week.)`);
        console.log(`   League check complete.\n`);
        return { checked: true, defended: false, inCohort: false };
    }

    console.log(`Cohort Size: ${status.totalUsers} users`);
    console.log(`Your Current Rank: ${status.currentRank ? `#${status.currentRank}` : 'Unranked'} (${status.userScore} XP)`);

    if (status.promotionCutoffRank) {
        console.log(`Promotion Zone: Ranks 1 to ${status.promotionCutoffRank}`);
    }
    if (status.demotionCutoffRank) {
        console.log(`Demotion Zone:  Ranks ${status.demotionCutoffRank} to ${status.totalUsers}`);
    } else {
        console.log(`Demotion Zone:  None in this league tier (${status.leagueName})`);
    }

    console.log(`\nStandings:`);
    console.log(formatLeaderboardTable(status));

    // Status evaluation
    if (status.isInPromotionZone) {
        console.log(`\nStatus: PROMOTION ZONE (Rank #${status.currentRank})`);
    } else if (status.isSafe) {
        console.log(`\nStatus: SAFE ZONE (Rank #${status.currentRank})`);
    } else {
        console.log(`\nStatus: DEMOTION ZONE (Rank #${status.currentRank}, bottom ${status.demotedCount} users)`);
    }

    // Stop here if user is out of the demotion zone
    if (!status.isInDemotionZone) {
        console.log(`Not in demotion zone. No extra lessons needed.`);
        console.log(`====================================================\n`);
        return {
            checked: true,
            defended: false,
            inDemotion: false,
            currentRank: status.currentRank,
            userScore: status.userScore
        };
    }

    // Run lessons until reaching target rank
    console.log(`\nIn demotion zone.`);
    console.log(`Target Rank: #${targetRank} or higher (staying between 1st and 9th place).`);
    console.log(`5th Place Score: ${status.fifthPlaceScore} XP`);
    console.log(`Estimated XP Needed: ~${status.xpNeededForFifth} XP (~${Math.ceil(status.xpNeededForFifth / 15)} lessons)`);
    console.log(`Delay between lessons: ${minDelaySec}-${maxDelaySec}s.`);

    if (dryRun) {
        console.log(`\n[Dry-Run] Check complete. Exiting without running lessons.`);
        return { checked: true, defended: false, dryRun: true };
    }

    const headers = getHeaders(token);
    const userInfo = await getUserLanguages();

    let lessonsCompleted = 0;
    let totalEarnedXp = 0;
    let currentScore = status.userScore;
    let currentRank = status.currentRank;

    while (currentRank > targetRank && lessonsCompleted < maxLessons) {
        const lessonNum = lessonsCompleted + 1;
        console.log(`\n[League Checker] Starting lesson ${lessonNum} (Rank #${currentRank}, ${currentScore} XP)...`);

        try {
            const session = await createPracticeSession(headers, userInfo);
            console.log(`   Session created (ID: ${session.id})`);

            // Pause before submitting the lesson
            await sleep(1500);

            const rewards = await submitPracticeSession(headers, session);
            const xpGain = rewards?.xpGain ?? rewards?.xp ?? rewards?.awardedXp ?? 15;
            totalEarnedXp += xpGain;
            currentScore += xpGain;
            lessonsCompleted++;

            console.log(`   Submitted session. Earned +${xpGain} XP (Total earned: +${totalEarnedXp} XP)`);

            // Recalculate estimated rank against cohort
            const competitorScores = status.rankings
                .filter(r => !r.isCurrentUser)
                .map(r => r.score);
            const estimatedRank = competitorScores.filter(s => s >= currentScore).length + 1;

            console.log(`   Estimated Rank: #${estimatedRank} (${currentScore} XP) | 5th Place: ${status.fifthPlaceScore} XP`);

            // Refresh live leaderboard data when target rank is reached
            if (estimatedRank <= targetRank) {
                console.log(`\nEstimated rank reached #${estimatedRank} (target: #${targetRank} or higher).`);
                try {
                    const freshStatus = await getLeaderboardStatus(token, userId);
                    if (freshStatus.hasActiveCohort) {
                        currentRank = freshStatus.currentRank;
                        currentScore = freshStatus.userScore;
                        console.log(`   Live rank: #${currentRank} (${currentScore} XP)`);
                    }
                } catch {
                    currentRank = estimatedRank;
                }

                if (currentRank <= targetRank) {
                    console.log(`\nTarget reached.`);
                    console.log(`   Current Rank: #${currentRank} in ${status.leagueName}.`);
                    console.log(`   Between 1st and 9th place. Stopping lessons.`);
                    break;
                }
            } else {
                currentRank = estimatedRank;
            }

            if (lessonsCompleted >= maxLessons) {
                console.log(`\nReached lesson limit (${maxLessons}) for this run.`);
                console.log(`   Current Rank: #${currentRank}. Will continue in the next scheduled run.`);
                break;
            }

            // Wait 1 to 2 minutes before starting the next lesson
            const delayMs = getRandomDelay(minDelaySec, maxDelaySec);
            const delaySec = Math.round(delayMs / 1000);
            console.log(`Waiting ${delaySec}s before next lesson...`);
            await sleep(delayMs);

        } catch (lessonErr) {
            console.error(`Lesson ${lessonNum} failed: ${lessonErr.message}`);
            // Wait 10 seconds before retrying
            await sleep(10000);
        }
    }

    console.log(`\n====================================================`);
    console.log(`League checker run finished:`);
    console.log(`   Lessons Completed: ${lessonsCompleted}`);
    console.log(`   Total XP Earned:   +${totalEarnedXp} XP`);
    console.log(`   Final Rank:        #${currentRank}`);
    console.log(`====================================================\n`);

    return {
        checked: true,
        defended: true,
        lessonsCompleted,
        totalEarnedXp,
        finalRank: currentRank
    };
}

const main = async () => {
    const targetRank = parseInt(process.env.TARGET_RANK, 10) || 5;
    const maxLessons = parseInt(process.env.MAX_LEAGUE_LESSONS, 10) || 25;
    const dryRun = process.env.DRY_RUN === 'true' || process.env.CHECK_ONLY === 'true';

    await checkAndDefendLeague({
        targetRank,
        maxLessons,
        dryRun
    });
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\nError during league checker run: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    getRandomDelay,
    formatLeaderboardTable,
    checkAndDefendLeague,
    main
};
