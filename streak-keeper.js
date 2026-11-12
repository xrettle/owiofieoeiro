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

    const currentSlot = getCurrentSlot(localInfo.totalMinutes);

    // If outside all 3 time slots, exit immediately
    if (!currentSlot) {
        console.log(`\nCurrent time (${localInfo.timeStr}) is outside all configured time slots:`);
        TIME_SLOTS.forEach(s => console.log(`   - ${s.name}: ${s.start} - ${s.end}`));

        if (alreadyPracticed && isLeagueCheckerEnabled) {
            console.log('\nChecking league status...');
            await checkAndDefendLeague();
        }

        console.log(`Exiting.`);
        process.exit(0);
    }

    console.log(`\nActive Time Slot: ${currentSlot.name} (${currentSlot.start} - ${currentSlot.end})`);

    const isTargetSlot = currentSlot.id === schedule.slot.id;
    const isFinalSlot = currentSlot.id === TIME_SLOTS[TIME_SLOTS.length - 1].id;

    // Practice is done today; run league checker if enabled
    if (alreadyPracticed) {
        console.log(`\nDaily practice is already complete. Running league checker...`);
        if (isLeagueCheckerEnabled) {
            await checkAndDefendLeague();
        }
        console.log(`\nStreak keeper run finished.`);
        process.exit(0);
    }

    // If this is not today's selected slot
    if (!isTargetSlot) {
        if (isFinalSlot) {
            // Fallback: earlier slot did not complete today's lesson, so run in the final slot
            console.log(`\nFallback triggered:`);
            console.log(`   Earlier slot (${schedule.slot.name}) passed without a completed lesson.`);
            console.log(`   Running in the final slot (${currentSlot.name}) instead.`);
        } else {
            console.log(`\nToday's lesson is scheduled for the ${schedule.slot.name} slot (${schedule.targetTimeStr}).`);
            console.log(`   Skipping current ${currentSlot.name} slot.`);
            process.exit(0);
        }
    }

    // Calculate delay to reach target time
    const currentTotalSec = localInfo.totalSeconds;
    let delaySec = isTargetSlot
        ? (schedule.targetTotalSeconds - currentTotalSec)
        : 0;

    // If the target time within this slot has already arrived or passed, run immediately
    if (delaySec <= 0) {
        console.log(`\nTarget time (${schedule.targetTimeStr}) reached. Starting lesson...`);
    } else {
        const waitMinutes = Math.floor(delaySec / 60);
        const waitRemainderSec = delaySec % 60;
        console.log(`\nTarget time is ${schedule.targetTimeStr}.`);
        console.log(`   Waiting ${waitMinutes}m ${waitRemainderSec}s before running lesson...`);
        await sleep(delaySec * 1000);
        console.log(`\nStarting lesson at ${schedule.targetTimeStr}...`);
    }

    // Complete daily lesson
    await completeLessons(1);

    // Run league checker after lesson completion
    if (isLeagueCheckerEnabled) {
        console.log(`\nRunning league checker...`);
        await checkAndDefendLeague();
    }

    console.log(`\nStreak keeper run finished.`);
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
    main
};
