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
 * Extracts the user ID (sub claim) from a Duolingo JWT token payload
 */
function getUserIdFromToken(token) {
    try {
        const cleaned = cleanToken(token);
        const parts = cleaned.split('.');
        if (parts.length >= 2) {
            const payloadJson = decodeBase64Url(parts[1]);
            if (payloadJson) {
                const payload = JSON.parse(payloadJson);
                if (payload && payload.sub) {
                    return String(payload.sub);
                }
            }
        }
    } catch {
        // Return null if token cannot be decoded
    }
    return null;
}

/**
 * Resolves token and userId from environment variables or JWT payload
 */
function getCredentials() {
    const rawToken = process.env.TOKEN || process.env.token || process.env.DUOLINGO_JWT || process.env.jwt_token || '';
    const token = cleanToken(rawToken);

    let rawUserId = process.env.USER_ID || process.env.userId || process.env.DUOLINGO_USER_ID || process.env.logged_out_uuid || '';
    rawUserId = cleanString(rawUserId);

    // If userId looks like a UUID (e.g. from logged_out_uuid) or is empty, try extracting sub from JWT
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
    const subFromToken = getUserIdFromToken(token);

    let userId = rawUserId;
    if (!userId || isUuid) {
        if (subFromToken) {
            userId = subFromToken;
        }
    } else if (!/^\d+$/.test(userId) && subFromToken) {
        userId = subFromToken;
    }

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
        throw new Error('Duolingo auth token is required. Please set the TOKEN environment variable / repository secret.');
    }
    if (!userId) {
        throw new Error('Duolingo User ID could not be determined. Please verify your token or set the USER_ID secret.');
    }

    const headers = getHeaders(token);
    const url = `https://www.duolingo.com/2017-06-30/users/${userId}?fields=fromLanguage,learningLanguage,streak,streakData,currentCourse,username,name`;

    const res = await fetch(url, {
        headers,
        method: "GET"
    });

    if (!res.ok) {
        const text = await res.text();
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

    return {
        fromLanguage,
        learningLanguage,
        streak,
        streakData: data.streakData || null,
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
