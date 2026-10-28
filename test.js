/**
 * Unit Test Suite for Duolingo Streak Keeper & Helper Utilities
 */

const assert = require('assert');
const {
    cleanString,
    cleanToken,
    inspectToken,
    getUserIdFromToken,
    getCredentials,
    getHeaders,
    removeQuotes
} = require('./helper.js');

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
// Scenario A: User only provides TOKEN
process.env.TOKEN = mockJwt;
delete process.env.token;
delete process.env.USER_ID;
delete process.env.userId;
let creds = getCredentials();
assert.strictEqual(creds.token, mockJwt);
assert.strictEqual(creds.userId, '84920194'); // Auto-extracted from JWT!

// Scenario B: User provided logged_out_uuid as USER_ID (the old bug from README)
process.env.USER_ID = '3a5c12e4-789a-4bc1-9012-3456789abcde'; // A UUID
creds = getCredentials();
assert.strictEqual(creds.userId, '84920194'); // Should override UUID with real sub from token!

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

// 6. Test Date Range Generation for Backfill Loop
console.log('Test 6: Date range generation for backfilling');
function generateDateRange(startStr, endStr) {
    const dates = [];
    const cur = new Date(startStr);
    cur.setUTCHours(12, 0, 0, 0);
    const end = new Date(endStr);
    end.setUTCHours(12, 0, 0, 0);
    while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
}

const range = generateDateRange('2024-05-20', '2024-05-23');
assert.deepStrictEqual(range, ['2024-05-20', '2024-05-21', '2024-05-22', '2024-05-23']);
console.log('   ✅ Date range generation passed\n');

console.log('🎉 All 6 test suites passed successfully!\n');
