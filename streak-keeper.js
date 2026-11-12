/**
 * Duolingo Streak Keeper
 *
 * Keeps your Duolingo streak active by running daily practice at a random time
 * in one of three daily time slots:
 *
 *   1. Morning:   6:40 AM  - 7:30 AM  (06:40 - 07:30)
 *   2. Afternoon: 5:00 PM  - 6:30 PM  (17:00 - 18:30)
 *   3. Evening:   8:15 PM  - 8:50 PM  (20:15 - 20:50)
 *
 * Each day, it picks one slot and a random time inside that slot.
 */

const {
    getLocalTimeInfo,
    hasPracticedToday,
    getUserLanguages,
    getCredentials
} = require('./helper.js');
const { completeLessons, sleep } = require('./xp.js');
const { checkAndDefendLeague } = require('./league-checker.js');

/**
 * Default daily active time windows
 */
const TIME_SLOTS = [
    {
        id: 0,
        name: 'Morning',
        start: '06:40',
        end: '07:30',
        startMin: 6 * 60 + 40,   // 400
        endMin: 7 * 60 + 30      // 450
    },
    {
        id: 1,
        name: 'Afternoon',
        start: '17:00',
        end: '18:30',
        startMin: 17 * 60,       // 1020
        endMin: 18 * 60 + 30     // 1110
    },
    {
        id: 2,
        name: 'Evening',
        start: '20:15',
        end: '20:50',
        startMin: 20 * 60 + 15,  // 1215
        endMin: 20 * 60 + 50     // 1250
    }
];

/**
 * 32-bit FNV-1a pseudo-random hash generator for deterministic day schedules
 */
function pseudoRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
}

/**
 * Computes the chosen time slot and random target time for a given calendar date
 */
function getDaySchedule(dateStr, salt = 'duo_streak_seed', slots = TIME_SLOTS) {
    const seed1 = `${dateStr}_${salt}_slot`;
    const slotIndex = Math.floor(pseudoRandom(seed1) * slots.length);
    const chosenSlot = slots[slotIndex];

    const seed2 = `${dateStr}_${salt}_time`;
    const minOffset = Math.floor(pseudoRandom(seed2) * (chosenSlot.endMin - chosenSlot.startMin));
    const targetMin = chosenSlot.startMin + minOffset;

    const seed3 = `${dateStr}_${salt}_sec`;
    const targetSec = Math.floor(pseudoRandom(seed3) * 60);

    const targetHour = Math.floor(targetMin / 60);
    const targetMinute = targetMin % 60;
    const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}:${String(targetSec).padStart(2, '0')}`;

    return {
        slot: chosenSlot,
        targetHour,
        targetMinute,
        targetSecond: targetSec,
        targetTotalSeconds: targetMin * 60 + targetSec,
        targetTimeStr
    };
}

/**
 * Determines which time slot the current minute falls into (if any)
 */
function getCurrentSlot(totalMinutes, slots = TIME_SLOTS) {
    return slots.find(s => totalMinutes >= s.startMin && totalMinutes <= s.endMin) || null;
}

/**
 * Evaluates the required action for the streak keeper based on current time and practice status
 */
function decideStreakKeeperAction({ alreadyPracticed, currentTotalSec, schedule, currentSlot }) {
    if (alreadyPracticed) {
        return { action: 'ALREADY_COMPLETED' };
    }
    if (currentTotalSec >= schedule.targetTotalSeconds) {
        return { action: 'RUN_IMMEDIATELY_TARGET_PASSED' };
    }
    const delaySec = schedule.targetTotalSeconds - currentTotalSec;
    const isTargetSlot = currentSlot && currentSlot.id === schedule.slot.id;
    if (isTargetSlot || delaySec <= 30 * 60) {
        return { action: 'WAIT_AND_RUN', delaySec };
    }
    return { action: 'SKIP_TOO_EARLY', delaySec };
}

const main = async () => {
    const timeZone = process.env.TIMEZONE || 'America/Los_Angeles';
    const mode = (process.env.MODE || 'random').toLowerCase().trim();
    const { token, userId } = getCredentials();

    if (!token) {
        console.error('Error: Duolingo auth token (TOKEN) is required.');
        process.exit(1);
    }

    const now = new Date();
    const localInfo = getLocalTimeInfo(now, timeZone);
    const schedule = getDaySchedule(localInfo.dateStr);

    console.log(`====================================================`);
    console.log(`Duolingo Streak Keeper`);
    console.log(`====================================================`);
    console.log(`Timezone: ${timeZone}`);
    console.log(`Local Date: ${localInfo.dateStr}`);
    console.log(`Current Local Time: ${localInfo.timeStr}`);
    console.log(`Scheduled Slot: ${schedule.slot.name} (${schedule.slot.start} - ${schedule.slot.end})`);
    console.log(`Target Time: ${schedule.targetTimeStr}`);
    console.log(`====================================================\n`);

    const isLeagueCheckerEnabled = process.env.LEAGUE_CHECKER !== 'false' && process.env.LEAGUE_CHECKER !== '0';

    // Mode 1: Check / Dry-Run
    if (mode === 'check' || mode === 'dry-run') {
        console.log('Mode: Check (dry run)');
        try {
            const userInfo = await getUserLanguages();
            const alreadyPracticed = hasPracticedToday(userInfo, localInfo.dateStr, timeZone);
            console.log(`User: ${userInfo.username} (ID: ${userInfo.userId})`);
            console.log(`Current Streak: ${userInfo.streak} days`);
            console.log(`Practiced Today: ${alreadyPracticed ? 'YES' : 'NO'}`);
        } catch (err) {
            console.log(`Note: Could not check user status: ${err.message}`);
        }

        if (isLeagueCheckerEnabled) {
            console.log('\nChecking league status (dry run)...');
            try {
                await checkAndDefendLeague({ dryRun: true });
            } catch (lbErr) {
                console.log(`League check skipped: ${lbErr.message}`);
            }
        }

        console.log('\nDry run complete. Exiting.');
        process.exit(0);
    }

    // Mode 2: Immediate Execution (Manual Run)
    if (mode === 'immediate' || mode === 'now' || process.env.FORCE === 'true') {
        console.log('Running lesson now...');
        await completeLessons(1);

        if (isLeagueCheckerEnabled) {
            console.log('\nRunning league checker...');
            await checkAndDefendLeague();
        }

        process.exit(0);
    }

    // Mode 3: Scheduled Time Slot
    console.log('Checking if practice is already completed today...');
    let userInfo = null;
    let alreadyPracticed = false;
    try {
        userInfo = await getUserLanguages();
        alreadyPracticed = hasPracticedToday(userInfo, localInfo.dateStr, timeZone);
        if (alreadyPracticed) {
            console.log(`\nToday's practice is already done.`);
            console.log(`Current Streak: ${userInfo.streak} days.`);
        } else {
            console.log(`Today's practice not done yet. Current Streak: ${userInfo.streak} days.`);
        }
    } catch (fetchErr) {
        console.warn(`Warning: Could not verify today's practice status (${fetchErr.message}). Continuing with schedule.`);
    }

    // Determine action to take based on schedule and completion status
    const currentTotalSec = localInfo.totalSeconds;
    const currentSlot = getCurrentSlot(localInfo.totalMinutes);
    const decision = decideStreakKeeperAction({
        alreadyPracticed,
        currentTotalSec,
        schedule,
        currentSlot
    });

    if (decision.action === 'ALREADY_COMPLETED') {
        console.log(`\n[STATUS: ALREADY COMPLETED]`);
        console.log(`Daily practice is already recorded. Current Streak: ${userInfo?.streak || 'active'} days.`);
        if (isLeagueCheckerEnabled) {
            console.log('\nChecking league status...');
            await checkAndDefendLeague();
        }
        console.log(`\nStreak keeper run finished.`);
        process.exit(0);
    }

    if (decision.action === 'RUN_IMMEDIATELY_TARGET_PASSED') {
        console.log(`\n[ACTION REQUIRED] Today's target time (${schedule.targetTimeStr}) has arrived or passed.`);
        console.log(`Practice has not been recorded yet today. Starting lesson immediately to protect streak...`);
        await completeLessons(1);
        if (isLeagueCheckerEnabled) {
            console.log('\nRunning league checker...');
            await checkAndDefendLeague();
        }
        console.log(`\n[STATUS: COMPLETED - LESSON SUBMITTED] Streak preserved!`);
        process.exit(0);
    }

    if (decision.action === 'WAIT_AND_RUN') {
        const waitMinutes = Math.floor(decision.delaySec / 60);
        const waitRemainderSec = decision.delaySec % 60;
        console.log(`\nTarget time is ${schedule.targetTimeStr} (${schedule.slot.name} slot).`);
        console.log(`Waiting ${waitMinutes}m ${waitRemainderSec}s before running lesson...`);
        await sleep(decision.delaySec * 1000);
        console.log(`\nStarting lesson at target time (${schedule.targetTimeStr})...`);
        await completeLessons(1);
        if (isLeagueCheckerEnabled) {
            console.log('\nRunning league checker...');
            await checkAndDefendLeague();
        }
        console.log(`\n[STATUS: COMPLETED - LESSON SUBMITTED] Streak preserved!`);
        process.exit(0);
    }

    // SKIP_TOO_EARLY
    const waitMinutes = Math.floor(decision.delaySec / 60);
    console.log(`\n[STATUS: PENDING - NO PRACTICE PERFORMED YET]`);
    console.log(`Today's lesson is scheduled for ${schedule.targetTimeStr} in the ${schedule.slot.name} slot.`);
    console.log(`Current local time (${localInfo.timeStr}) is ${waitMinutes} minutes before the scheduled time.`);
    console.log(`A future scheduled runner will execute practice when the slot arrives.`);
    process.exit(0);
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\nError during streak keeper run: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    TIME_SLOTS,
    pseudoRandom,
    getDaySchedule,
    getCurrentSlot,
    decideStreakKeeperAction,
    main
};
