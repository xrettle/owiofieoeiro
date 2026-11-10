/**
 * Duolingo Helper Utilities
 */

// Native fetch in Node 18+, or fallback to node-fetch if available
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

/**
 * Strips quotes and surrounding whitespace
 */
function cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    let cleaned = str.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned;
}

/**
 * Cleans Duolingo JWT authentication token
 */
function cleanToken(token) {
    if (!token) return '';
    let cleaned = cleanString(token);
    if (cleaned.startsWith('jwt_token=')) {
        cleaned = cleaned.replace(/^jwt_token=/, '').trim();
    }
    if (cleaned.toLowerCase().startsWith('bearer ')) {
        cleaned = cleaned.slice(7).trim();
    }
    cleaned = cleanString(cleaned);
    return cleaned;
}

/**
 * Safely decodes base64url string to utf-8 text
 */
function decodeBase64Url(str) {
    try {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'base64url').toString('utf8');
        }
        if (typeof atob !== 'undefined') {
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            return decodeURIComponent(escape(atob(base64)));
        }
    } catch {
        // Fallback or ignore
    }
    return null;
}

/**
 * Inspects a Duolingo JWT token and checks format, sub, and expiration
 */
function inspectToken(token) {
    if (!token) {
        return { valid: false, error: 'No token provided' };
    }
    const cleaned = cleanToken(token);
    const parts = cleaned.split('.');
    if (parts.length < 2) {
        return { valid: false, error: 'Token is not a valid JWT format (expected 3 dot-separated segments)' };
    }
    const payloadJson = decodeBase64Url(parts[1]);
    if (!payloadJson) {
        return { valid: false, error: 'Unable to decode JWT payload' };
    }
    try {
        const payload = JSON.parse(payloadJson);
        const nowSec = Math.floor(Date.now() / 1000);
        const exp = payload.exp ? Number(payload.exp) : null;
        const isExpired = exp ? exp < nowSec : false;
        const expiredDate = exp ? new Date(exp * 1000) : null;

        return {
            valid: true,
            sub: payload.sub ? String(payload.sub) : null,
            username: payload.username || null,
            exp,
            isExpired,
            expiredDate,
            payload
        };
    } catch (e) {
        return { valid: false, error: `Invalid JSON in JWT payload: ${e.message}` };
    }
}

/**
 * Extracts the user ID (sub claim) from a Duolingo JWT token payload
 */
function getUserIdFromToken(token) {
    const info = inspectToken(token);
    return info.valid && info.sub ? info.sub : null;
}

/**
 * Resolves token and userId from environment variables or JWT payload
 */
function getCredentials() {
    const rawToken = process.env.TOKEN || process.env.token || process.env.DUOLINGO_JWT || process.env.jwt_token || '';
    const token = cleanToken(rawToken);

    let rawUserId = process.env.USER_ID || process.env.userId || process.env.DUOLINGO_USER_ID || process.env.logged_out_uuid || '';
    rawUserId = cleanString(rawUserId);

    const subFromToken = getUserIdFromToken(token);
    // The JWT token's 'sub' claim is ALWAYS the authoritative account ID.
    // If present in the token, we use it directly to prevent any credentials mismatch.
    const userId = subFromToken || rawUserId;

    return { token, userId };
}

/**
 * Returns HTTP headers for Duolingo API requests
 */
function getHeaders(token) {
    const cleaned = cleanToken(token);
    return {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9",
        "authorization": `Bearer ${cleaned}`,
        "cookie": `jwt_token=${cleaned}`,
        "content-type": "application/json",
        "origin": "https://www.duolingo.com",
        "referer": "https://www.duolingo.com/practice",
        "referrer-policy": "strict-origin-when-cross-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };
}

/**
 * Extracts normalized local date and time parts for a given Date and IANA TimeZone
 */
function getLocalTimeInfo(date = new Date(), timeZone = 'America/Los_Angeles') {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);

    let hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(map.minute, 10);
    const second = parseInt(map.second, 10);
    const dateStr = `${map.year}-${map.month}-${map.day}`;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    const totalMinutes = hour * 60 + minute;
    const totalSeconds = totalMinutes * 60 + second;

    return { dateStr, timeStr, hour, minute, second, totalMinutes, totalSeconds };
}

/**
 * Checks if the user has already completed today's practice on Duolingo
 */
function hasPracticedToday(userInfo, targetDateStr, timeZone = 'America/Los_Angeles') {
    if (!userInfo) return false;

    // 1. Check streakData.currentStreak.endDate
    const currentStreak = userInfo.streakData?.currentStreak;
    if (currentStreak && currentStreak.endDate) {
        if (currentStreak.endDate === targetDateStr) {
            return true;
        }
    }

    // 2. Check streakData.updatedTimestamp
    const updatedTs = userInfo.streakData?.updatedTimestamp;
    if (updatedTs) {
        const ms = updatedTs < 1e11 ? updatedTs * 1000 : updatedTs;
        const updatedDate = new Date(ms);
        const updatedLocalStr = getLocalTimeInfo(updatedDate, timeZone).dateStr;
        if (updatedLocalStr === targetDateStr) {
            return true;
        }
    }

    // 3. Check xpGains
    if (Array.isArray(userInfo.xpGains) && userInfo.xpGains.length > 0) {
        const latest = userInfo.xpGains[userInfo.xpGains.length - 1];
        if (latest && latest.time) {
            const ms = latest.time < 1e11 ? latest.time * 1000 : latest.time;
            const gainDate = new Date(ms);
            const gainLocalStr = getLocalTimeInfo(gainDate, timeZone).dateStr;
            if (gainLocalStr === targetDateStr) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Fetches user languages, streak, and profile data from Duolingo API
 */
async function getUserLanguages(customToken, customUserId) {
    const { token, userId } = (customToken && customUserId) 
        ? { token: cleanToken(customToken), userId: cleanString(customUserId) }
        : getCredentials();

    if (!token) {
        throw new Error(
            'Duolingo auth token is required. Please set the TOKEN repository secret in GitHub Settings > Secrets and variables > Actions.'
        );
    }

    const tokenInfo = inspectToken(token);
    if (!tokenInfo.valid) {
        throw new Error(
            `Invalid Duolingo auth token format: ${tokenInfo.error}.\n` +
            `Please ensure you copied the entire jwt_token cookie value without quotes.`
        );
    }

    if (tokenInfo.isExpired) {
        const expiredStr = tokenInfo.expiredDate ? tokenInfo.expiredDate.toUTCString() : 'in the past';
        throw new Error(
            `\n============================================================\n` +
            `❌ YOUR DUOLINGO AUTH TOKEN HAS EXPIRED!\n` +
            `📅 Token expiration date: ${expiredStr}\n\n` +
            `Duolingo JWT tokens expire every few months and cannot be used once expired.\n` +
            `Duolingo rejects expired tokens with HTTP 401 Unauthorized.\n\n` +
            `👉 TO FIX THIS (takes 30 seconds):\n` +
            `1. Open https://www.duolingo.com in your web browser and ensure you are logged in.\n` +
            `2. Press F12 (or Cmd+Option+J on Mac) to open Developer Tools -> Console.\n` +
            `3. Run this command:\n` +
            `   document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];\n` +
            `4. Copy the output string.\n` +
            `5. In your GitHub repo: Settings > Secrets and variables > Actions > edit 'TOKEN' and paste the fresh token.\n` +
            `============================================================`
        );
    }

    if (!userId) {
        throw new Error('Duolingo User ID could not be determined from your token. Please verify your token.');
    }

    const headers = getHeaders(token);
    // Request standard scalar fields
    const url = `https://www.duolingo.com/2017-06-30/users/${userId}?fields=fromLanguage,learningLanguage,streak,currentCourse,username,name`;

    const res = await fetch(url, {
        headers,
        method: "GET"
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
            throw new Error(
                `Duolingo Authentication Failed (HTTP 401 Unauthorized).\n` +
                `Duolingo rejected your TOKEN as invalid, expired, or revoked.\n\n` +
                `👉 TO FIX THIS (takes 30 seconds):\n` +
                `1. Open https://www.duolingo.com in your browser and log in.\n` +
                `2. Press F12 (or Cmd+Option+J on Mac) -> Console, and run:\n` +
                `   document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];\n` +
                `3. Copy the token string (without quotes).\n` +
                `4. Go to GitHub repo Settings > Secrets and variables > Actions > update 'TOKEN'.`
            );
        }
        throw new Error(`Failed to fetch user data (HTTP ${res.status}): ${text}`);
    }

    const data = await res.json();

    const learningLanguage = data.learningLanguage || data.currentCourse?.learningLanguage;
    const fromLanguage = data.fromLanguage || data.currentCourse?.fromLanguage;

    if (!learningLanguage || !fromLanguage) {
        throw new Error(`Could not determine languages from user profile: ${JSON.stringify(data)}`);
    }

    const streak = typeof data.streak === 'number' 
        ? data.streak 
        : (data.streakData?.currentStreak?.length ?? 0);

    // Fetch streakData separately with subfields so it never blocks profile loading
    let streakData = data.streakData || null;
    let xpGains = data.xpGains || null;
    try {
        const sdRes = await fetch(`https://www.duolingo.com/2017-06-30/users/${userId}?fields=streakData{currentStreak,previousStreak,updatedTimestamp},xpGains`, {
            headers,
            method: "GET"
        });
        if (sdRes.ok) {
            const sdJson = await sdRes.json();
            if (sdJson.streakData) streakData = sdJson.streakData;
            if (sdJson.xpGains) xpGains = sdJson.xpGains;
        }
    } catch {
        // Optional metadata
    }

    return {
        fromLanguage,
        learningLanguage,
        streak,
        streakData,
        xpGains,
        username: data.username || data.name || userId,
        userId
    };
}

/**
 * Attempts to create a practice session on Duolingo
 */
async function createPracticeSession(headers, userLanguages) {
    const sessionConfigs = [
        {
            name: "GLOBAL_PRACTICE (Standard)",
            body: {
                challengeTypes: [],
                fromLanguage: userLanguages.fromLanguage,
                isFinalLevel: false,
                isV2: true,
                juicy: true,
                learningLanguage: userLanguages.learningLanguage,
                smartTipsVersion: 2,
                type: "GLOBAL_PRACTICE"
            }
        },
        {
            name: "LISTEN_PRACTICE",
            body: {
                challengeTypes: ["listen"],
                fromLanguage: userLanguages.fromLanguage,
                isFinalLevel: false,
                isV2: true,
                juicy: true,
                learningLanguage: userLanguages.learningLanguage,
                smartTipsVersion: 2,
                type: "LISTEN_PRACTICE"
            }
        },
        {
            name: "GLOBAL_PRACTICE (Full challenge set)",
            body: {
                challengeTypes: ["listen", "translate", "assist", "name", "select"],
                fromLanguage: userLanguages.fromLanguage,
                isFinalLevel: false,
                isV2: true,
                juicy: true,
                learningLanguage: userLanguages.learningLanguage,
                smartTipsVersion: 2,
                type: "GLOBAL_PRACTICE"
            }
        }
    ];

    let lastError = null;

    for (const config of sessionConfigs) {
        try {
            const res = await fetch("https://www.duolingo.com/2017-06-30/sessions", {
                headers,
                method: 'POST',
                body: JSON.stringify(config.body),
            });

            if (res.ok) {
                const session = await res.json();
                if (session && session.id) {
                    return session;
                }
            } else {
                const text = await res.text();
                lastError = new Error(`HTTP ${res.status} for ${config.name}: ${text}`);
            }
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Failed to create session with all supported configurations.');
}

/**
 * Submits the completed session payload. Supports an optional custom targetTimestamp
 * to allow backdating lessons.
 */
async function submitPracticeSession(headers, session, targetTimestamp) {
    const endTime = typeof targetTimestamp === 'number'
        ? Math.floor(targetTimestamp)
        : Math.floor(Date.now() / 1000);
    const startTime = endTime - 65;

    const submissionPayload = {
        ...session,
        heartsLeft: session.heartsLeft ?? 5,
        startTime,
        endTime,
        failed: false,
        maxInLessonStreak: 10,
        shouldLearnThings: true,
        enableBonusPoints: false,
    };

    const res = await fetch(`https://www.duolingo.com/2017-06-30/sessions/${session.id}`, {
        headers,
        method: 'PUT',
        body: JSON.stringify(submissionPayload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Session submission failed (HTTP ${res.status}): ${text}`);
    }

    return await res.json();
}

/**
 * Official Duolingo League Tiers (0 to 9)
 */
const LEAGUE_NAMES = [
    'Bronze',   // 0
    'Silver',   // 1
    'Gold',     // 2
    'Sapphire', // 3
    'Ruby',     // 4
    'Emerald',  // 5
    'Amethyst', // 6
    'Pearl',    // 7
    'Obsidian', // 8
    'Diamond'   // 9
];

/**
 * Parses raw Duolingo leaderboard API JSON payload
 *
 * @param {object} data Raw JSON from duolingo-leaderboards-prod
 * @param {string|number} userId Target user's account ID
 * @returns {object} Normalized leaderboard status
 */
function parseLeaderboardData(data, userId) {
    if (!data || typeof data !== 'object') {
        return {
            valid: false,
            error: 'Empty or invalid leaderboard payload',
            hasActiveCohort: false
        };
    }

    const tier = typeof data.tier === 'number' ? data.tier : 0;
    const leagueNames = Array.isArray(data.league_ids) && data.league_ids.length > 0
        ? data.league_ids
        : LEAGUE_NAMES;
    const leagueName = leagueNames[tier] || `Tier ${tier}`;

    const streakInTier = typeof data.streak_in_tier === 'number' ? data.streak_in_tier : 0;
    const topThreeFinishes = typeof data.top_three_finishes === 'number' ? data.top_three_finishes : 0;
    const numWins = typeof data.num_wins === 'number' ? data.num_wins : 0;

    const active = data.active;
    if (!active || !active.cohort || !Array.isArray(active.cohort.rankings)) {
        return {
            valid: true,
            tier,
            leagueName,
            streakInTier,
            topThreeFinishes,
            numWins,
            hasActiveCohort: false,
            message: 'User is not currently placed in an active weekly cohort (complete 1 lesson to join).'
        };
    }

    const rawRankings = active.cohort.rankings;
    const strUserId = userId ? String(userId) : null;

    const rankings = rawRankings.map((r, idx) => ({
        rank: idx + 1,
        userId: String(r.user_id),
        displayName: r.display_name || `User ${r.user_id}`,
        score: typeof r.score === 'number' ? r.score : 0,
        avatarUrl: r.avatar_url || null,
        hasRecentActivity: Boolean(r.has_recent_activity_15),
        streakExtendedToday: Boolean(r.streak_extended_today),
        isCurrentUser: strUserId ? String(r.user_id) === strUserId : false
    }));

    const totalUsers = rankings.length;
    let currentUser = rankings.find(r => r.isCurrentUser);

    if (!currentUser && strUserId) {
        // Fallback if user is in active payload directly
        currentUser = {
            rank: totalUsers + 1,
            userId: strUserId,
            displayName: 'You',
            score: typeof active.score === 'number' ? active.score : 0,
            avatarUrl: null,
            hasRecentActivity: false,
            streakExtendedToday: false,
            isCurrentUser: true
        };
    }

    const currentRank = currentUser ? currentUser.rank : null;
    const userScore = currentUser ? currentUser.score : 0;

    // Ruleset evaluation for promotion & demotion
    const ruleset = active.contest?.ruleset || data.leaderboard?.ruleset || {};

    // 1. Promoted count
    let promotedCount = 0;
    if (typeof ruleset.num_promoted === 'number') {
        promotedCount = ruleset.num_promoted;
    } else if (Array.isArray(ruleset.num_promoted)) {
        promotedCount = ruleset.num_promoted.length === 1 && typeof ruleset.num_promoted[0] === 'number' && ruleset.num_promoted[0] < 15
            ? ruleset.num_promoted[0]
            : ruleset.num_promoted.length;
    } else if (typeof ruleset.num_winners === 'number') {
        promotedCount = ruleset.num_winners;
    }
    // Default promotion count if not specified
    if (promotedCount === 0 && totalUsers > 0 && tier < 9) {
        promotedCount = Math.min(7, totalUsers);
    }
    const promotionCutoffRank = promotedCount > 0 ? promotedCount : null;

    // 2. Demoted count
    let demotedCount = 0;
    if (typeof ruleset.num_demoted === 'number') {
        demotedCount = ruleset.num_demoted;
    } else if (Array.isArray(ruleset.num_demoted)) {
        demotedCount = ruleset.num_demoted.length === 1 && typeof ruleset.num_demoted[0] === 'number' && ruleset.num_demoted[0] < 15
            ? ruleset.num_demoted[0]
            : ruleset.num_demoted.length;
    } else if (typeof ruleset.num_losers === 'number') {
        demotedCount = ruleset.num_losers;
    }
    // Bronze tier (0) has no demotion
    if (tier === 0) {
        demotedCount = 0;
    } else if (demotedCount === 0 && totalUsers >= 10) {
        demotedCount = Math.min(5, Math.floor(totalUsers / 3));
    }
    const demotionCutoffRank = (demotedCount > 0 && totalUsers >= demotedCount)
        ? (totalUsers - demotedCount + 1)
        : null;

    // Status flags: rank relative to cutoffs is the ground truth
    const isInDemotionZone = tier > 0 && Boolean(
        demotionCutoffRank && currentRank
            ? currentRank >= demotionCutoffRank
            : active.is_demoted
    );

    const isInPromotionZone = Boolean(
        promotionCutoffRank && currentRank
            ? currentRank <= promotionCutoffRank
            : active.is_promoted
    );

    const isSafe = !isInDemotionZone;

    // Target 5th Place (or highest possible rank in small cohort)
    const targetRank = Math.min(5, totalUsers || 5);
    const fifthPlaceUser = totalUsers >= targetRank ? rankings[targetRank - 1] : null;
    const fifthPlaceScore = fifthPlaceUser ? fifthPlaceUser.score : 0;

    let xpNeededForFifth = 0;
    if (currentRank && currentRank > targetRank) {
        xpNeededForFifth = Math.max(15, (fifthPlaceScore - userScore) + 15);
    }

    return {
        valid: true,
        hasActiveCohort: true,
        tier,
        leagueName,
        streakInTier,
        topThreeFinishes,
        numWins,
        totalUsers,
        rankings,
        currentUser,
        currentRank,
        userScore,
        promotedCount,
        promotionCutoffRank,
        demotedCount,
        demotionCutoffRank,
        isInPromotionZone,
        isInDemotionZone,
        isSafe,
        targetRank,
        fifthPlaceUser,
        fifthPlaceScore,
        xpNeededForFifth,
        contestStart: active.contest?.contest_start ? new Date(active.contest.contest_start) : null,
        contestEnd: active.contest?.contest_end ? new Date(active.contest.contest_end) : null
    };
}

/**
 * Fetches current Duolingo leaderboard status from production microservice
 */
async function getLeaderboardStatus(customToken, customUserId) {
    const { token, userId } = (customToken && customUserId)
        ? { token: cleanToken(customToken), userId: cleanString(customUserId) }
        : getCredentials();

    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required to check leaderboards.');
    }
    if (!userId) {
        throw new Error('Duolingo user ID is required to check leaderboards.');
    }

    const headers = getHeaders(token);
    const leaderboardIds = [
        '7d9f5dd1-8423-491a-91f2-2532052038ce', // Standard leagues
        '4b668ba6-288d-4b78-81a3-7b213175ae2c'  // Diamond Tournament fallback
    ];

    let lastError = null;
    for (const lbId of leaderboardIds) {
        try {
            const url = `https://duolingo-leaderboards-prod.duolingo.com/leaderboards/${lbId}/users/${userId}?client_unlocked=true&get_reactions=true`;
            const res = await fetch(url, { headers, method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                return parseLeaderboardData(data, userId);
            }
            if (res.status === 401) {
                throw new Error('Duolingo Authentication Failed (HTTP 401 Unauthorized) when checking leaderboards.');
            }
            const errText = await res.text();
            lastError = new Error(`HTTP ${res.status}: ${errText}`);
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Failed to fetch leaderboard data.');
}

module.exports = {
    fetch,
    cleanString,
    cleanToken,
    decodeBase64Url,
    inspectToken,
    getUserIdFromToken,
    getCredentials,
    getHeaders,
    getLocalTimeInfo,
    hasPracticedToday,
    getUserLanguages,
    createPracticeSession,
    submitPracticeSession,
    LEAGUE_NAMES,
    parseLeaderboardData,
    getLeaderboardStatus,
    removeQuotes: cleanString,
    // Dynamic backward-compatible getter for legacy code
    get headers() {
        const { token } = getCredentials();
        return getHeaders(token);
    }
};
