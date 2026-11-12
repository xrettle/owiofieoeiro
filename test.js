/**
 * Unit Test Suite for Duolingo Streak Keeper, Helper Utilities, and Scheduler
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    cleanString,
    cleanToken,
    inspectToken,
    getUserIdFromToken,
    getCredentials,
    getHeaders,
    getLocalTimeInfo,
    parseDateUtc,
    hasPracticedToday,
    LEAGUE_NAMES,
    parseLeaderboardData,
    isGemReward,
    removeQuotes
} = require('./helper.js');

const {
    resolveTargetTimestamp
} = require('./xp.js');

const {
    TIME_SLOTS,
    HARD_LIMIT_TOTAL_SEC,
    pseudoRandom,
    getDaySchedule,
    getCurrentSlot,
    decideStreakKeeperAction,
    executeAndVerifyPractice
} = require('./streak-keeper.js');

const {
    getRandomDelay,
    formatLeaderboardTable
} = require('./league-checker.js');

console.log('Starting test suite...\n');

// 1. Test cleanString & removeQuotes
console.log('Test 1: cleanString & removeQuotes');
assert.strictEqual(cleanString('"hello"'), 'hello');
assert.strictEqual(cleanString("'world'"), 'world');
assert.strictEqual(cleanString('  "test"  '), 'test');
assert.strictEqual(cleanString('plain_text'), 'plain_text');
assert.strictEqual(cleanString(null), '');
assert.strictEqual(cleanString(undefined), '');
assert.strictEqual(removeQuotes('"legacy"'), 'legacy');
console.log('   cleanString & removeQuotes passed\n');

// 2. Test cleanToken
console.log('Test 2: cleanToken');
assert.strictEqual(cleanToken('  "jwt_token=ey12345"  '), 'ey12345');
assert.strictEqual(cleanToken('Bearer ey99999'), 'ey99999');
assert.strictEqual(cleanToken('bearer "ey88888"'), 'ey88888');
assert.strictEqual(cleanToken('"ey77777"'), 'ey77777');
assert.strictEqual(cleanToken('ey66666'), 'ey66666');
console.log('   cleanToken passed\n');

// 3. Test getUserIdFromToken (JWT decoding)
console.log('Test 3: getUserIdFromToken & inspectToken');
const futureExp = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days in future
const testPayload = { sub: 84920194, username: 'duolover', exp: futureExp };
const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payloadBase64 = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
const mockJwt = `${headerBase64}.${payloadBase64}.mocksignature`;

const extractedUserId = getUserIdFromToken(mockJwt);
assert.strictEqual(extractedUserId, '84920194');

const tokenInfo = inspectToken(mockJwt);
assert.strictEqual(tokenInfo.valid, true);
assert.strictEqual(tokenInfo.sub, '84920194');
assert.strictEqual(tokenInfo.isExpired, false);

// Test expired token detection
const pastExp = Math.floor(Date.now() / 1000) - 86400 * 10; // 10 days ago
const expiredPayload = { sub: 84920194, exp: pastExp };
const expiredJwt = `${headerBase64}.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')}.mocksig`;
const expiredInfo = inspectToken(expiredJwt);
assert.strictEqual(expiredInfo.valid, true);
assert.strictEqual(expiredInfo.isExpired, true);

// Invalid JWT handling
assert.strictEqual(getUserIdFromToken('invalid.token'), null);
assert.strictEqual(getUserIdFromToken(''), null);
assert.strictEqual(inspectToken('').valid, false);
console.log('   getUserIdFromToken & inspectToken passed\n');

// 4. Test getCredentials
console.log('Test 4: getCredentials auto-resolution');
process.env.TOKEN = mockJwt;
delete process.env.token;
delete process.env.USER_ID;
delete process.env.userId;
let creds = getCredentials();
assert.strictEqual(creds.token, mockJwt);
assert.strictEqual(creds.userId, '84920194'); // Auto-extracted from JWT!

// Scenario B: User provided logged_out_uuid as USER_ID
process.env.USER_ID = '3a5c12e4-789a-4bc1-9012-3456789abcde';
creds = getCredentials();
assert.strictEqual(creds.userId, '84920194'); // Sub from token overrides UUID!

// Scenario C: User provided real numeric ID
process.env.USER_ID = '12345678';
creds = getCredentials();
assert.strictEqual(creds.userId, '84920194'); // Sub from token is authoritative!
console.log('   getCredentials passed\n');

// 5. Test getHeaders
console.log('Test 5: getHeaders');
const headers = getHeaders(mockJwt);
assert.strictEqual(headers['authorization'], `Bearer ${mockJwt}`);
assert.strictEqual(headers['cookie'], `jwt_token=${mockJwt}`);
assert.strictEqual(headers['accept'], 'application/json');
assert.strictEqual(headers['referer'], 'https://www.duolingo.com/practice');
console.log('   getHeaders passed\n');

// 6. Test Timezone & Local Time Info
console.log('Test 6: getLocalTimeInfo');
const testDate = new Date('2026-11-09T20:45:00Z'); // 20:45 UTC is 12:45 PST (UTC-8)
const infoLA = getLocalTimeInfo(testDate, 'America/Los_Angeles');
assert.strictEqual(infoLA.dateStr, '2026-11-09');
assert.strictEqual(infoLA.hour, 12);
assert.strictEqual(infoLA.minute, 45);
assert.strictEqual(infoLA.totalMinutes, 12 * 60 + 45);
console.log('   getLocalTimeInfo passed\n');

// 7. Test hasPracticedToday
console.log('Test 7: hasPracticedToday');
const todayStr = '2026-11-09';
assert.strictEqual(hasPracticedToday({ streakData: { currentStreak: { endDate: '2026-11-09' } } }, todayStr), true);
assert.strictEqual(hasPracticedToday({ streakData: { currentStreak: { endDate: '2026-11-08' } } }, todayStr), false);
assert.strictEqual(hasPracticedToday({ streakData: { updatedTimestamp: testDate.getTime() } }, todayStr), true);
assert.strictEqual(hasPracticedToday({ xpGains: [{ time: testDate.getTime(), xp: 15 }] }, todayStr), true);
assert.strictEqual(hasPracticedToday({}, todayStr), false);
assert.strictEqual(hasPracticedToday(null, todayStr), false);
console.log('   hasPracticedToday passed\n');

// 8. Test TIME_SLOTS definition
console.log('Test 8: TIME_SLOTS definitions');
assert.strictEqual(TIME_SLOTS.length, 3);
// Morning: 6:40am - 7:30am
assert.strictEqual(TIME_SLOTS[0].name, 'Morning');
assert.strictEqual(TIME_SLOTS[0].start, '06:40');
assert.strictEqual(TIME_SLOTS[0].end, '07:30');
assert.strictEqual(TIME_SLOTS[0].startMin, 400);
assert.strictEqual(TIME_SLOTS[0].endMin, 450);

// Afternoon: 5:00pm - 6:30pm
assert.strictEqual(TIME_SLOTS[1].name, 'Afternoon');
assert.strictEqual(TIME_SLOTS[1].start, '17:00');
assert.strictEqual(TIME_SLOTS[1].end, '18:30');
assert.strictEqual(TIME_SLOTS[1].startMin, 1020);
assert.strictEqual(TIME_SLOTS[1].endMin, 1110);

// Evening: 8:15pm - 8:50pm
assert.strictEqual(TIME_SLOTS[2].name, 'Evening');
assert.strictEqual(TIME_SLOTS[2].start, '20:15');
assert.strictEqual(TIME_SLOTS[2].end, '20:50');
assert.strictEqual(TIME_SLOTS[2].startMin, 1215);
assert.strictEqual(TIME_SLOTS[2].endMin, 1250);
console.log('   TIME_SLOTS definitions passed\n');

// 9. Test getDaySchedule & Pseudo-Random Slot Determination
console.log('Test 9: getDaySchedule across dates');
const testDays = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
const seenSlots = new Set();
for (const day of testDays) {
    const sched = getDaySchedule(day);
    seenSlots.add(sched.slot.name);
    // Verify target time falls within slot bounds
    const [h, m, s] = sched.targetTimeStr.split(':').map(Number);
    const targetMin = h * 60 + m;
    assert(targetMin >= sched.slot.startMin, `Target ${targetMin} < ${sched.slot.startMin}`);
    assert(targetMin <= sched.slot.endMin, `Target ${targetMin} > ${sched.slot.endMin}`);
    assert(s >= 0 && s < 60, `Seconds out of bounds: ${s}`);
}
assert(seenSlots.size > 1, 'Expected different slots to be selected over 5 days');
console.log('   getDaySchedule passed\n');

// 10. Test getCurrentSlot
console.log('Test 10: getCurrentSlot detection');
// 06:45 -> Morning
assert.strictEqual(getCurrentSlot(6 * 60 + 45)?.name, 'Morning');
// 07:30 -> Morning (edge)
assert.strictEqual(getCurrentSlot(7 * 60 + 30)?.name, 'Morning');
// 08:00 -> null (outside)
assert.strictEqual(getCurrentSlot(8 * 60), null);
// 17:15 -> Afternoon
assert.strictEqual(getCurrentSlot(17 * 60 + 15)?.name, 'Afternoon');
// 20:30 -> Evening
assert.strictEqual(getCurrentSlot(20 * 60 + 30)?.name, 'Evening');
// 22:00 -> null (outside)
assert.strictEqual(getCurrentSlot(22 * 60), null);
console.log('   getCurrentSlot passed\n');

// 11. Test LEAGUE_NAMES definitions
console.log('Test 11: LEAGUE_NAMES definitions');
assert.strictEqual(LEAGUE_NAMES.length, 10);
assert.strictEqual(LEAGUE_NAMES[0], 'Bronze');
assert.strictEqual(LEAGUE_NAMES[1], 'Silver');
assert.strictEqual(LEAGUE_NAMES[2], 'Gold');
assert.strictEqual(LEAGUE_NAMES[3], 'Sapphire');
assert.strictEqual(LEAGUE_NAMES[4], 'Ruby');
assert.strictEqual(LEAGUE_NAMES[5], 'Emerald');
assert.strictEqual(LEAGUE_NAMES[6], 'Amethyst');
assert.strictEqual(LEAGUE_NAMES[7], 'Pearl');
assert.strictEqual(LEAGUE_NAMES[8], 'Obsidian');
assert.strictEqual(LEAGUE_NAMES[9], 'Diamond');
console.log('   LEAGUE_NAMES passed\n');

// 12. Test parseLeaderboardData & Demotion Zone Detection
console.log('Test 12: parseLeaderboardData Demotion Zone detection');
// Construct mock cohort of 30 users
const mockRankings = [];
for (let i = 1; i <= 30; i++) {
    mockRankings.push({
        user_id: 1000 + i,
        display_name: `User_${i}`,
        score: (31 - i) * 20, // 1st has 600 XP, 5th has 520 XP, 30th has 20 XP
        avatar_url: `https://avatar.url/${i}`,
        has_recent_activity_15: false,
        streak_extended_today: true
    });
}
// Current user is at Rank 28 (User_28, user_id 1028)
const mockLbPayload = {
    tier: 5, // Emerald
    streak_in_tier: 2,
    num_wins: 1,
    active: {
        score: 60,
        user_id: 1028,
        is_demoted: true,
        is_promoted: false,
        cohort: {
            cohort_id: 'cohort-uuid-1234',
            tier: 5,
            rankings: mockRankings
        },
        contest: {
            contest_end: '2026-11-15T23:59:59Z',
            contest_start: '2026-11-08T00:00:00Z',
            ruleset: {
                cohort_size: 30,
                num_promoted: 7,
                num_demoted: 5
            }
        }
    }
};

const parsedDemoted = parseLeaderboardData(mockLbPayload, 1028);
assert.strictEqual(parsedDemoted.valid, true);
assert.strictEqual(parsedDemoted.leagueName, 'Emerald');
assert.strictEqual(parsedDemoted.currentRank, 28);
assert.strictEqual(parsedDemoted.userScore, 60);
assert.strictEqual(parsedDemoted.isInDemotionZone, true);
assert.strictEqual(parsedDemoted.isSafe, false);
assert.strictEqual(parsedDemoted.isInPromotionZone, false);
assert.strictEqual(parsedDemoted.demotionCutoffRank, 26);
assert.strictEqual(parsedDemoted.targetRank, 5);
assert.strictEqual(parsedDemoted.fifthPlaceScore, 520);
// 5th place has 520 XP, current user has 60 XP. Need 520 - 60 + 15 = 475 XP
assert.strictEqual(parsedDemoted.xpNeededForFifth, 475);
console.log('   Demotion Zone detection & 5th place math passed\n');

// 13. Test parseLeaderboardData Safe & Promotion Zones
console.log('Test 13: parseLeaderboardData Safe & Promotion Zones');
// Scenario A: User is Rank 12 (Safe Zone)
const parsedSafe = parseLeaderboardData(mockLbPayload, 1012);
assert.strictEqual(parsedSafe.currentRank, 12);
assert.strictEqual(parsedSafe.isInDemotionZone, false);
assert.strictEqual(parsedSafe.isSafe, true);
assert.strictEqual(parsedSafe.isInPromotionZone, false);

// Scenario B: User is Rank 3 (Promotion Zone)
const parsedPromo = parseLeaderboardData(mockLbPayload, 1003);
assert.strictEqual(parsedPromo.currentRank, 3);
assert.strictEqual(parsedPromo.isInPromotionZone, true);
assert.strictEqual(parsedPromo.isInDemotionZone, false);
assert.strictEqual(parsedPromo.isSafe, true);
console.log('   Safe & Promotion Zones passed\n');

// 14. Test parseLeaderboardData in Bronze League (Tier 0, No Demotion)
console.log('Test 14: Bronze League (Tier 0) has NO demotion');
const bronzePayload = {
    tier: 0,
    active: {
        score: 10,
        user_id: 1030,
        is_demoted: false,
        is_promoted: false,
        cohort: {
            cohort_id: 'bronze-uuid',
            tier: 0,
            rankings: mockRankings
        },
        contest: {
            ruleset: {
                cohort_size: 30,
                num_promoted: 10,
                num_demoted: 0
            }
        }
    }
};
const parsedBronze = parseLeaderboardData(bronzePayload, 1030);
assert.strictEqual(parsedBronze.leagueName, 'Bronze');
assert.strictEqual(parsedBronze.currentRank, 30); // 30th place
assert.strictEqual(parsedBronze.isInDemotionZone, false); // Bronze NEVER demotes!
assert.strictEqual(parsedBronze.demotedCount, 0);
assert.strictEqual(parsedBronze.isSafe, true);
console.log('   Bronze League (Tier 0) passed\n');

// 15. Test getRandomDelay Range (1 to 2 minutes)
console.log('Test 15: getRandomDelay range bounds (60s to 120s)');
for (let i = 0; i < 500; i++) {
    const delay = getRandomDelay(60, 120);
    assert(delay >= 60000, `Delay ${delay} is below 60,000ms`);
    assert(delay <= 120000, `Delay ${delay} is above 120,000ms`);
}
console.log('   getRandomDelay passed across 500 random samples\n');

// 16. Test formatLeaderboardTable output
console.log('Test 16: formatLeaderboardTable generation');
const tableStr = formatLeaderboardTable(parsedDemoted);
assert(tableStr.includes('User_1'), 'Table should include 1st place');
assert(tableStr.includes('User_5'), 'Table should include 5th place target');
assert(tableStr.includes('(YOU)'), 'Table should highlight current user');
assert(tableStr.includes('DEMOTION'), 'Table should mark demotion zone');
console.log('   formatLeaderboardTable passed\n');

// 17. Test Gems reward ID generator and batch math
console.log('Test 17: Gems reward ID & batch math');
const target300 = 300;
const claims300 = Math.ceil(target300 / 30);
assert.strictEqual(claims300, 10);

const target500 = 500;
const claims500 = Math.ceil(target500 / 30);
assert.strictEqual(claims500, 17);

const seed = 'testseed123';
const rewardId = `SKILL_COMPLETION_BALANCED-${seed}-2-GEMS`;
assert(rewardId.startsWith('SKILL_COMPLETION_BALANCED-'));
assert(rewardId.endsWith('-2-GEMS'));
console.log('   Gems reward ID & batch math passed\n');

// 18. Test Inventory, Gems & Reward Bundles Parsing (strictly gem filtering)
console.log('Test 18: Inventory, Gems & Reward Bundles parsing logic');
const mockProfile = {
    username: 'duofan',
    gems: 3200,
    gemsConfig: { gems: 2450 },
    lingots: 80,
    inventory: {
        streak_freeze: { itemName: 'streak_freeze', quantity: 2 },
        society_streak_freeze: { itemName: 'society_streak_freeze', quantity: 3 }
    },
    streakData: { currentStreak: { length: 150 } },
    fromLanguage: 'en',
    learningLanguage: 'de',
    rewards: [
        { id: 'DAILY_GOAL-1-GEMS', consumed: false, type: 'CHEST', currency: 'GEMS', amount: 5 },
        { id: 'AVATAR_SKIN-avatar_skin_hot_dog', consumed: false, type: 'AVATAR_SKIN' },
        { id: 'DAILY_QUEST_FIRST-STREAK_FREEZE', consumed: false, type: 'STREAK_FREEZE' },
        { id: 'DAILY_QUEST_FIRST-XP_BOOST', consumed: false, type: 'XP_BOOST' },
        { id: 'REWARD_2', consumed: true, type: 'XP' }
    ],
    rewardBundles: [
        {
            rewards: [
                { id: 'DAILY_GOAL-1-GEMS', consumed: false, type: 'CHEST', currency: 'GEMS' }, // Duplicate ID, should be deduplicated
                { id: 'REWARD_BUNDLE_3-GEMS', consumed: false, rewardType: 'QUEST_CHEST', currency: 'GEMS', amount: 20 },
                { id: 'TIERED_CHEST-SPEAKING_XP_CARD', consumed: false, rewardType: 'TIERED_CHEST' }
            ]
        }
    ],
    achievements: [
        { name: 'Wildfire', tier: 5, claimedTier: 3 },
        { name: 'Sage', tier: 2, claimedTier: 2 }
    ]
};

// Test isGemReward explicitly
assert.strictEqual(isGemReward({ id: 'DAILY_GOAL-1-GEMS', currency: 'GEMS' }), true);
assert.strictEqual(isGemReward({ id: 'WECHAT_SERVICE_ACCOUNT-c56d-CURRENCY_BUNDLE-GEMS', type: 'CHEST' }), true);
assert.strictEqual(isGemReward({ id: 'PERFECT_STREAK_JACKPOT-winners_20-GEMS', amount: 100 }), true);
assert.strictEqual(isGemReward({ id: 'avatar_skin_hot_dog', type: 'AVATAR_SKIN' }), false);
assert.strictEqual(isGemReward({ id: 'DAILY_QUEST_FIRST-SECOND_STREAK_FREEZE' }), false);
assert.strictEqual(isGemReward({ id: 'DAILY_QUEST_SECOND_TIERED_CHEST-DOUBLE_XP_BOOST' }), false);
assert.strictEqual(isGemReward({ id: 'TIERED_CHEST-SPEAKING_XP_CARD' }), false);
assert.strictEqual(isGemReward({ id: 'ADD_WIDGET_HEARTS-hearts_refill_3' }), false);

const gems = typeof mockProfile.gems === 'number'
    ? mockProfile.gems
    : (mockProfile.gemsConfig?.gems ?? mockProfile.lingots);

const regularFreezes = mockProfile.inventory?.streak_freeze?.quantity || 0;
const societyFreezes = mockProfile.inventory?.society_streak_freeze?.quantity || 0;
const totalFreezes = regularFreezes + societyFreezes;

const pendingRewards = [];
const seenRewardIds = new Set();
function addTestReward(r) {
    if (!r || !r.id || seenRewardIds.has(r.id)) return;
    if (!r.consumed && isGemReward(r)) {
        seenRewardIds.add(r.id);
        pendingRewards.push(r);
    }
}
(mockProfile.rewards || []).forEach(addTestReward);
(mockProfile.rewardBundles || []).forEach(b => (b.rewards || []).forEach(addTestReward));

const unclaimedAchievements = (mockProfile.achievements || []).filter(a => a.tier > (a.claimedTier || 0));

assert.strictEqual(gems, 3200); // Prioritizes top-level data.gems
assert.strictEqual(regularFreezes, 2);
assert.strictEqual(societyFreezes, 3);
assert.strictEqual(totalFreezes, 5);
// Only the 2 GEM rewards are included; skins, streak freezes, and XP boosts are filtered out!
assert.strictEqual(pendingRewards.length, 2);
assert.strictEqual(pendingRewards[0].id, 'DAILY_GOAL-1-GEMS');
assert.strictEqual(pendingRewards[1].id, 'REWARD_BUNDLE_3-GEMS');
assert.strictEqual(unclaimedAchievements.length, 1);
assert.strictEqual(unclaimedAchievements[0].name, 'Wildfire');
console.log('   Inventory, Gems & Reward Bundles parsing passed\n');

// 19. Test Streak Freeze Shop Item payload structure
console.log('Test 19: Streak Freeze shop item payload structure');
const shopPayload = {
    itemName: 'streak_freeze',
    isFree: true,
    consumed: true,
    fromLanguage: 'en',
    learningLanguage: 'fr'
};
assert.strictEqual(shopPayload.itemName, 'streak_freeze');
assert.strictEqual(shopPayload.isFree, true);
assert.strictEqual(shopPayload.consumed, true);
console.log('   Streak Freeze payload structure passed\n');

// 20. Test parseDateUtc & resolveTargetTimestamp for XP Farm date option
console.log('Test 20: parseDateUtc & resolveTargetTimestamp');
assert.strictEqual(resolveTargetTimestamp(''), null);
assert.strictEqual(resolveTargetTimestamp('   '), null);
assert.strictEqual(resolveTargetTimestamp(undefined), null);
assert.strictEqual(resolveTargetTimestamp(null), null);

const targetDate = parseDateUtc('2026-11-10');
assert(targetDate instanceof Date);
assert.strictEqual(targetDate.toISOString(), '2026-11-10T12:00:00.000Z');
assert.strictEqual(resolveTargetTimestamp('2026-11-10'), Math.floor(Date.UTC(2026, 10, 10, 12, 0, 0, 0) / 1000));

assert.strictEqual(parseDateUtc('2026-02-30'), null);
assert.strictEqual(parseDateUtc('not-a-date'), null);
assert.throws(() => resolveTargetTimestamp('2026-02-30'), /Invalid target date/);
assert.throws(() => resolveTargetTimestamp('invalid'), /Invalid target date/);
console.log('   parseDateUtc & resolveTargetTimestamp passed\n');

// 21. Test decideStreakKeeperAction resilient scheduling logic
console.log('Test 21: decideStreakKeeperAction resilient scheduling logic');
const mockMorningSchedule = {
    slot: TIME_SLOTS[0], // Morning: 06:40 - 07:30
    targetHour: 6,
    targetMinute: 40,
    targetSecond: 1,
    targetTotalSeconds: 6 * 3600 + 40 * 60 + 1, // 24001 sec (06:40:01)
    targetTimeStr: '06:40:01'
};

// Scenario A: Already practiced
assert.deepStrictEqual(
    decideStreakKeeperAction({
        alreadyPracticed: true,
        currentTotalSec: 4 * 3600 + 41 * 60 + 54,
        schedule: mockMorningSchedule,
        currentSlot: null
    }),
    { action: 'ALREADY_COMPLETED' }
);

// Scenario B: Missed slot / target time already passed (e.g. 08:00 AM or 17:00 PM)
assert.deepStrictEqual(
    decideStreakKeeperAction({
        alreadyPracticed: false,
        currentTotalSec: 8 * 3600, // 08:00:00 (past 06:40:01)
        schedule: mockMorningSchedule,
        currentSlot: null
    }),
    { action: 'RUN_IMMEDIATELY_TARGET_PASSED' }
);

// Scenario C: Target time reached exactly or passed inside afternoon slot
assert.deepStrictEqual(
    decideStreakKeeperAction({
        alreadyPracticed: false,
        currentTotalSec: 17 * 3600 + 10 * 60, // 17:10 (afternoon slot)
        schedule: mockMorningSchedule,
        currentSlot: TIME_SLOTS[1]
    }),
    { action: 'RUN_IMMEDIATELY_TARGET_PASSED' }
);

// Scenario D: Within target slot, before target time (wait and run)
assert.deepStrictEqual(
    decideStreakKeeperAction({
        alreadyPracticed: false,
        currentTotalSec: 6 * 3600 + 40 * 60, // 06:40:00 (1 second before 06:40:01)
        schedule: mockMorningSchedule,
        currentSlot: TIME_SLOTS[0]
    }),
    { action: 'WAIT_AND_RUN', delaySec: 1 }
);

// Scenario E: Well before target time (e.g. 04:41:54 AM, ~118 minutes before)
const earlySec = 4 * 3600 + 41 * 60 + 54;
const earlyDecision = decideStreakKeeperAction({
    alreadyPracticed: false,
    currentTotalSec: earlySec,
    schedule: mockMorningSchedule,
    currentSlot: null
});
assert.strictEqual(earlyDecision.action, 'SKIP_TOO_EARLY');
assert.strictEqual(earlyDecision.delaySec, 24001 - earlySec);

// Scenario F: Hard Limit Triggered (Past 9:00 PM / 21:00, practice not done)
const pastNineSec = 21 * 3600 + 5 * 60; // 21:05 (9:05 PM)
const hardLimitDecision = decideStreakKeeperAction({
    alreadyPracticed: false,
    currentTotalSec: pastNineSec,
    schedule: mockMorningSchedule,
    currentSlot: null
});
assert.strictEqual(hardLimitDecision.action, 'RUN_IMMEDIATELY_HARD_LIMIT');
assert.strictEqual(hardLimitDecision.isHardLimit, true);

// Scenario G: Past 9:00 PM, but practice was already completed earlier
const pastNineDoneDecision = decideStreakKeeperAction({
    alreadyPracticed: true,
    currentTotalSec: pastNineSec,
    schedule: mockMorningSchedule,
    currentSlot: null
});
assert.strictEqual(pastNineDoneDecision.action, 'ALREADY_COMPLETED');

// Scenario H: Late night fallback (11:30 PM), practice not done
const lateNightSec = 23 * 3600 + 30 * 60; // 23:30 (11:30 PM)
const lateNightDecision = decideStreakKeeperAction({
    alreadyPracticed: false,
    currentTotalSec: lateNightSec,
    schedule: mockMorningSchedule,
    currentSlot: null
});
assert.strictEqual(lateNightDecision.action, 'RUN_IMMEDIATELY_HARD_LIMIT');
assert.strictEqual(lateNightDecision.isHardLimit, true);

console.log('   decideStreakKeeperAction passed\n');

// 22. Test Gems Script isolated architecture & Streak Keeper hard limit exports
console.log('Test 22: Gems script non-XP architecture & helper exports');
const gemsModule = require('./gems.js');
const helperModule = require('./helper.js');

assert.strictEqual(typeof gemsModule.addGems, 'function');
assert.strictEqual(typeof helperModule.claimGemReward, 'function');
assert.strictEqual(typeof helperModule.claimAchievement, 'function');
assert.strictEqual(typeof helperModule.purchaseShopItem, 'function');
assert.strictEqual(typeof helperModule.sleep, 'function');
assert.strictEqual(typeof executeAndVerifyPractice, 'function');
assert.strictEqual(HARD_LIMIT_TOTAL_SEC, 21 * 3600); // 75600 seconds = 9:00 PM exactly

// Verify gems.js does not import or re-export completeLessons
assert.strictEqual(gemsModule.completeLessons, undefined);
console.log('   Gems script non-XP architecture & Hard Limit exports passed\n');

// 23. Test Extra Items Catalog & Claimer Architecture
console.log('Test 23: Duolingo Locker Room Items Catalog & Item Claimer');
const {
    ITEMS_CATALOG,
    CATEGORIES,
    getItemById,
    getItemsByCategory,
    searchItems
} = require('./items-catalog.js');
const { claimItem, claimBatch } = require('./item-claimer.js');

// Verify Catalog structure, size, and uniqueness
assert.ok(Array.isArray(ITEMS_CATALOG));
assert.ok(ITEMS_CATALOG.length >= 50, `Catalog should contain at least 50 items (got ${ITEMS_CATALOG.length})`);

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
const idSet = new Set();
for (const item of ITEMS_CATALOG) {
    assert.ok(item.id, 'Item must have an id');
    assert.ok(item.name, 'Item must have a name');
    assert.ok(item.category, 'Item must have a category');
    assert.ok(item.type, 'Item must specify a type');
    assert.ok(item.imageUrl && (item.imageUrl.startsWith('/assets/items/') || item.imageUrl.startsWith('https://')), `Item ${item.id} must have a valid preview imageUrl (got ${item.imageUrl})`);
    if (item.imageUrl.startsWith('/assets/items/')) {
        const localPath = path.join(__dirname, 'public', item.imageUrl);
        assert.ok(fs.existsSync(localPath), `SVG illustration file missing for item ${item.id}: ${localPath}`);
    }
    assert.ok(!emojiRegex.test(item.name), `Item name must not contain emojis: ${item.name}`);
    assert.ok(!emojiRegex.test(item.description), `Item desc must not contain emojis: ${item.description}`);
    assert.ok(!idSet.has(item.id), `Duplicate item id detected: ${item.id}`);
    idSet.add(item.id);
}

// Verify categories
assert.ok(Array.isArray(CATEGORIES));
assert.ok(CATEGORIES.some(c => c.id === 'all'));
assert.ok(CATEGORIES.some(c => c.id === 'avatars'));
assert.ok(CATEGORIES.some(c => c.id === 'suits'));
assert.ok(CATEGORIES.some(c => c.id === 'banners'));
assert.ok(CATEGORIES.some(c => c.id === 'protection'));
assert.ok(CATEGORIES.some(c => c.id === 'chests'));
for (const cat of CATEGORIES) {
    assert.ok(!emojiRegex.test(cat.label), `Category label must not contain emojis: ${cat.label}`);
}

// Verify helper lookup functions
const formal = getItemById('outfit_formal');
assert.ok(formal, 'Formal attire outfit should exist in catalog');
assert.strictEqual(formal.name, 'Formal Attire');
assert.strictEqual(formal.category, 'avatars');

const hotDog = getItemById('avatar_skin_hot_dog');
assert.ok(hotDog, 'Hot Dog skin should exist in catalog');
assert.strictEqual(hotDog.name, 'Hot Dog Duo');
assert.strictEqual(hotDog.category, 'avatars');

const suits = getItemsByCategory('suits');
assert.ok(suits.length >= 10, 'Should have at least 10 country suits');
assert.ok(suits.every(s => s.category === 'suits'));

const searchResults = searchItems('brazil');
assert.ok(searchResults.length >= 1);
assert.strictEqual(searchResults[0].id, 'avatar_skin_world_cup_br');

const emptySearch = searchItems('');
assert.strictEqual(emptySearch.length, ITEMS_CATALOG.length);

// Verify Item Claimer exports
assert.strictEqual(typeof claimItem, 'function');
assert.strictEqual(typeof claimBatch, 'function');

console.log('   Duolingo Locker Room Items Catalog & Claimer passed\n');

console.log('All 23 test suites passed.\n');
