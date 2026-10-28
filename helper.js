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
    if (!streakData) {
        try {
            const sdRes = await fetch(`https://www.duolingo.com/2017-06-30/users/${userId}?fields=streakData{currentStreak,previousStreak}`, {
                headers,
                method: "GET"
            });
            if (sdRes.ok) {
                const sdJson = await sdRes.json();
                streakData = sdJson.streakData || null;
            }
        } catch {
            // Optional metadata
        }
    }

    return {
        fromLanguage,
        learningLanguage,
        streak,
        streakData,
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

module.exports = {
    fetch,
    cleanString,
    cleanToken,
    decodeBase64Url,
    inspectToken,
    getUserIdFromToken,
    getCredentials,
    getHeaders,
    getUserLanguages,
    createPracticeSession,
    submitPracticeSession,
    removeQuotes: cleanString,
    // Dynamic backward-compatible getter for legacy code
    get headers() {
        const { token } = getCredentials();
        return getHeaders(token);
    }
};
