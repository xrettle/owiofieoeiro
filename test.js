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
    removeQuotes
} = require('./helper.js');

const {
    TIME_SLOTS,
    pseudoRandom,
    getDaySchedule,
    getCurrentSlot
} = require('./streak-keeper.js');

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

console.log('🎉 All 10 test suites passed successfully!\n');
