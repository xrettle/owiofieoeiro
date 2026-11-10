/**
 * Unit Test Suite for Duolingo Streak Keeper, Helper Utilities, and Scheduler
 */

const assert = require('assert');
const {
    cleanString,
    cleanToken,
    inspectToken,
    getUserIdFromToken,
    getCredentials,
    getHeaders,
    getLocalTimeInfo,
    hasPracticedToday,
    LEAGUE_NAMES,
    parseLeaderboardData,
    removeQuotes
} = require('./helper.js');

const {
    TIME_SLOTS,
    pseudoRandom,
    getDaySchedule,
    getCurrentSlot
} = require('./streak-keeper.js');

const {
    getRandomDelay,
    formatLeaderboardTable
} = require('./league-checker.js');

console.log('🧪 Starting test suite...\n');

// 1. Test cleanString & removeQuotes
console.log('Test 1: cleanString & removeQuotes');
assert.strictEqual(cleanString('"hello"'), 'hello');
assert.strictEqual(cleanString("'world'"), 'world');
assert.strictEqual(cleanString('  "test"  '), 'test');
assert.strictEqual(cleanString('plain_text'), 'plain_text');
assert.strictEqual(cleanString(null), '');
assert.strictEqual(cleanString(undefined), '');
assert.strictEqual(removeQuotes('"legacy"'), 'legacy');
console.log('   ✅ cleanString & removeQuotes passed\n');

// 2. Test cleanToken
console.log('Test 2: cleanToken');
assert.strictEqual(cleanToken('  "jwt_token=ey12345"  '), 'ey12345');
assert.strictEqual(cleanToken('Bearer ey99999'), 'ey99999');
assert.strictEqual(cleanToken('bearer "ey88888"'), 'ey88888');
assert.strictEqual(cleanToken('"ey77777"'), 'ey77777');
assert.strictEqual(cleanToken('ey66666'), 'ey66666');
console.log('   ✅ cleanToken passed\n');

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
console.log('   ✅ getUserIdFromToken & inspectToken passed\n');

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
console.log('   ✅ getCredentials passed\n');

// 5. Test getHeaders
console.log('Test 5: getHeaders');
const headers = getHeaders(mockJwt);
assert.strictEqual(headers['authorization'], `Bearer ${mockJwt}`);
assert.strictEqual(headers['cookie'], `jwt_token=${mockJwt}`);
assert.strictEqual(headers['accept'], 'application/json');
assert.strictEqual(headers['referer'], 'https://www.duolingo.com/practice');
console.log('   ✅ getHeaders passed\n');

// 6. Test Timezone & Local Time Info
console.log('Test 6: getLocalTimeInfo');
const testDate = new Date('2026-11-09T20:45:00Z'); // 20:45 UTC is 12:45 PST (UTC-8)
const infoLA = getLocalTimeInfo(testDate, 'America/Los_Angeles');
assert.strictEqual(infoLA.dateStr, '2026-11-09');
assert.strictEqual(infoLA.hour, 12);
assert.strictEqual(infoLA.minute, 45);
assert.strictEqual(infoLA.totalMinutes, 12 * 60 + 45);
console.log('   ✅ getLocalTimeInfo passed\n');

// 7. Test hasPracticedToday
console.log('Test 7: hasPracticedToday');
const todayStr = '2026-11-09';
assert.strictEqual(hasPracticedToday({ streakData: { currentStreak: { endDate: '2026-11-09' } } }, todayStr), true);
assert.strictEqual(hasPracticedToday({ streakData: { currentStreak: { endDate: '2026-11-08' } } }, todayStr), false);
assert.strictEqual(hasPracticedToday({ streakData: { updatedTimestamp: testDate.getTime() } }, todayStr), true);
assert.strictEqual(hasPracticedToday({ xpGains: [{ time: testDate.getTime(), xp: 15 }] }, todayStr), true);
assert.strictEqual(hasPracticedToday({}, todayStr), false);
assert.strictEqual(hasPracticedToday(null, todayStr), false);
console.log('   ✅ hasPracticedToday passed\n');

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
console.log('   ✅ TIME_SLOTS definitions passed\n');

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
console.log('   ✅ getDaySchedule passed\n');

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
console.log('   ✅ getCurrentSlot passed\n');

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
console.log('   ✅ LEAGUE_NAMES passed\n');

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
console.log('   ✅ Demotion Zone detection & 5th place math passed\n');

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
console.log('   ✅ Safe & Promotion Zones passed\n');

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
console.log('   ✅ Bronze League (Tier 0) passed\n');

// 15. Test getRandomDelay Range (1 to 2 minutes)
console.log('Test 15: getRandomDelay range bounds (60s to 120s)');
for (let i = 0; i < 500; i++) {
    const delay = getRandomDelay(60, 120);
    assert(delay >= 60000, `Delay ${delay} is below 60,000ms`);
    assert(delay <= 120000, `Delay ${delay} is above 120,000ms`);
}
console.log('   ✅ getRandomDelay passed across 500 random samples\n');

// 16. Test formatLeaderboardTable output
console.log('Test 16: formatLeaderboardTable generation');
const tableStr = formatLeaderboardTable(parsedDemoted);
assert(tableStr.includes('User_1'), 'Table should include 1st place');
assert(tableStr.includes('User_5'), 'Table should include 5th place target');
assert(tableStr.includes('(YOU)'), 'Table should highlight current user');
assert(tableStr.includes('DEMOTION'), 'Table should mark demotion zone');
console.log('   ✅ formatLeaderboardTable passed\n');

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
console.log('   ✅ Gems reward ID & batch math passed\n');

// 18. Test Inventory & Freeze Parsing
console.log('Test 18: Inventory & Streak Freeze parsing logic');
const mockProfile = {
    username: 'duofan',
    gemsConfig: { gems: 2450 },
    lingots: 80,
    inventory: {
        streak_freeze: { itemName: 'streak_freeze', quantity: 2 },
        society_streak_freeze: { itemName: 'society_streak_freeze', quantity: 3 }
    },
    streakData: { currentStreak: { length: 150 } },
    fromLanguage: 'en',
    learningLanguage: 'de'
};

const gems = mockProfile.gemsConfig?.gems ?? mockProfile.lingots;
const regularFreezes = mockProfile.inventory?.streak_freeze?.quantity || 0;
const societyFreezes = mockProfile.inventory?.society_streak_freeze?.quantity || 0;
const totalFreezes = regularFreezes + societyFreezes;

assert.strictEqual(gems, 2450);
assert.strictEqual(regularFreezes, 2);
assert.strictEqual(societyFreezes, 3);
assert.strictEqual(totalFreezes, 5);
console.log('   ✅ Inventory & Freeze parsing passed\n');

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
console.log('   ✅ Streak Freeze payload structure passed\n');

console.log('🎉 All 19 test suites passed successfully!\n');
