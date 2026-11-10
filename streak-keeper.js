/**
 * Duolingo Intelligent Random Streak Keeper
 *
 * Automatically maintains your Duolingo streak by executing daily practice
 * at a randomized time within one of three realistic human time slots:
 *
 *   1. Morning:   6:40 AM  - 7:30 AM  (06:40 - 07:30)
 *   2. Afternoon: 5:00 PM  - 6:30 PM  (17:00 - 18:30)
 *   3. Evening:   8:15 PM  - 8:50 PM  (20:15 - 20:50)
 *
 * For each day, it pseudo-randomly selects one of the slots and a random minute
 * within that slot, making automated streak maintenance look completely natural.
 */

const {
    getLocalTimeInfo,
    hasPracticedToday,
    getUserLanguages,
    getCredentials
} = require('./helper.js');
const { completeLessons, sleep } = require('./xp.js');

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
        console.error('❌ Error: Duolingo auth token (TOKEN) is required.');
        process.exit(1);
    }

    const now = new Date();
    const localInfo = getLocalTimeInfo(now, timeZone);
    const schedule = getDaySchedule(localInfo.dateStr);

    console.log(`====================================================`);
    console.log(`🦉 Duolingo Streak Keeper - Randomized Scheduler`);
    console.log(`====================================================`);
    console.log(`🌍 Timezone: ${timeZone}`);
    console.log(`📅 Local Date: ${localInfo.dateStr}`);
    console.log(`⏰ Current Local Time: ${localInfo.timeStr}`);
    console.log(`🎲 Today's Scheduled Slot: ${schedule.slot.name} (${schedule.slot.start} - ${schedule.slot.end})`);
    console.log(`🎯 Today's Target Time: ${schedule.targetTimeStr}`);
    console.log(`====================================================\n`);

    // Mode 1: Check / Dry-Run
    if (mode === 'check' || mode === 'dry-run') {
        console.log('🔍 Mode: Check (Dry-Run inspection only)');
        try {
            const userInfo = await getUserLanguages();
            const alreadyPracticed = hasPracticedToday(userInfo, localInfo.dateStr, timeZone);
            console.log(`👤 User: ${userInfo.username} (ID: ${userInfo.userId})`);
            console.log(`🔥 Current Streak: ${userInfo.streak} days`);
            console.log(`✅ Practiced Today: ${alreadyPracticed ? 'YES' : 'NO'}`);
        } catch (err) {
            console.log(`⚠️ Note: Unable to check live user status: ${err.message}`);
        }
        console.log('\nDry-run complete. Exiting.');
        process.exit(0);
    }

    // Mode 2: Immediate Execution (Manual Run)
    if (mode === 'immediate' || mode === 'now' || process.env.FORCE === 'true') {
        console.log('⚡ Immediate execution requested. Running lesson now...');
        await completeLessons(1);
        process.exit(0);
    }

    // Mode 3: Intelligent Randomized Scheduler
    console.log('🔄 Checking if Duolingo practice is already completed today...');
    let userInfo = null;
    try {
        userInfo = await getUserLanguages();
        if (hasPracticedToday(userInfo, localInfo.dateStr, timeZone)) {
            console.log(`\n🎉 Today's practice is ALREADY completed on Duolingo!`);
            console.log(`🔥 Current Streak: ${userInfo.streak} days maintained.`);
            console.log(`👉 No additional practice needed today. Exiting cleanly.`);
            process.exit(0);
        }
        console.log(`ℹ️ Today's practice not yet recorded. Current Streak: ${userInfo.streak} days.`);
    } catch (fetchErr) {
        console.warn(`⚠️ Warning: Could not verify today's practice status (${fetchErr.message}). Proceeding with schedule.`);
    }

    const currentSlot = getCurrentSlot(localInfo.totalMinutes);

    // If outside all 3 time slots, exit immediately
    if (!currentSlot) {
        console.log(`\n⏰ Current time (${localInfo.timeStr}) is outside all configured time slots:`);
        TIME_SLOTS.forEach(s => console.log(`   - ${s.name}: ${s.start} - ${s.end}`));
        console.log(`Exiting cleanly.`);
        process.exit(0);
    }

    console.log(`\n📍 Active Time Slot: ${currentSlot.name} (${currentSlot.start} - ${currentSlot.end})`);

    const isTargetSlot = currentSlot.id === schedule.slot.id;
    const isFinalSlot = currentSlot.id === TIME_SLOTS[TIME_SLOTS.length - 1].id;

    // If this is NOT today's selected slot
    if (!isTargetSlot) {
        if (isFinalSlot) {
            // Failsafe: If today's earlier scheduled slot was missed or didn't run, execute in the final slot!
            console.log(`\n⚠️ FAILSAFE ACTIVATED:`);
            console.log(`   Earlier scheduled slot (${schedule.slot.name}) has passed and today's lesson is not yet completed.`);
            console.log(`   Running in the final slot (${currentSlot.name}) to guarantee streak protection!`);
        } else {
            console.log(`\n🎲 Today's lesson is scheduled for the ${schedule.slot.name} slot (${schedule.targetTimeStr}).`);
            console.log(`   Skipping current ${currentSlot.name} slot. Exiting cleanly.`);
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
        console.log(`\n🚀 Target time (${schedule.targetTimeStr}) has arrived! Starting practice lesson now...`);
    } else {
        const waitMinutes = Math.floor(delaySec / 60);
        const waitRemainderSec = delaySec % 60;
        console.log(`\n⏳ Target time is ${schedule.targetTimeStr}.`);
        console.log(`   Sleeping for ${waitMinutes}m ${waitRemainderSec}s before completing lesson...`);
        await sleep(delaySec * 1000);
        console.log(`\n⏰ Waking up at ${schedule.targetTimeStr}! Starting practice lesson...`);
    }

    // Complete the lesson!
    await completeLessons(1);
    console.log(`\n✨ Streak keeper run completed successfully!`);
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\n❌ Error during streak keeper run: ${err.message}`);
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
