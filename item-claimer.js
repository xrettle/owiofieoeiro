/**
 * Item Claimer Service
 *
 * Handles claiming, equipping, and unlocking Duolingo extra items
 * (avatars, country suits, tournament banners, streak freezes, chests).
 */

const {
    cleanToken,
    cleanString,
    getUserIdFromToken,
    getHeaders,
    getUserInventoryAndGems,
    claimGemReward,
    claimAchievement,
    purchaseShopItem,
    sleep,
    fetch
} = require('./helper.js');
const { ITEMS_CATALOG } = require('./items-catalog.js');

/**
 * Claims a specific item from the catalog for a user
 *
 * @param {string} rawToken Duolingo JWT token
 * @param {string} rawUserId Duolingo user ID
 * @param {string} itemId ID of the item in ITEMS_CATALOG
 * @param {object} [userProfile] Pre-fetched profile to avoid redundant API calls
 * @returns {Promise<{ success: boolean, item: object, message: string }>}
 */
async function claimItem(rawToken, rawUserId, itemId, userProfile = null) {
    const token = cleanToken(rawToken);
    let userId = cleanString(rawUserId);

    if (!token) {
        throw new Error('Duolingo auth token (JWT) is required. Please connect your account in the header.');
    }

    if (!userId) {
        userId = getUserIdFromToken(token);
    }

    if (!userId) {
        throw new Error('Could not determine Duolingo user ID from token. Please enter your User ID in Credentials.');
    }

    const item = ITEMS_CATALOG.find(i => i.id === itemId);
    if (!item) {
        throw new Error(`Item ${itemId} not found in catalog.`);
    }

    const headers = getHeaders(token);
    let profile = userProfile;
    if (!profile) {
        try {
            profile = await getUserInventoryAndGems(token, userId);
        } catch {
            profile = { fromLanguage: 'en', learningLanguage: 'es' };
        }
    }

    const languages = {
        fromLanguage: profile.fromLanguage || 'en',
        learningLanguage: profile.learningLanguage || 'es'
    };

    let claimed = false;
    let details = '';

    // Special Case: Unlimited Hearts Classroom Pass
    if (item.id === 'unlimited_hearts_pass' || item.type === 'CLASSROOM_PASS') {
        try {
            const classRes = await fetch('https://schools.duolingo.com/api/2/classrooms', {
                headers,
                method: 'POST',
                body: JSON.stringify({
                    classrooms: [{
                        from_language: languages.fromLanguage,
                        learning_language: languages.learningLanguage,
                        name: 'Duolingo Locker Room Pass'
                    }]
                })
            });
            if (classRes.ok) {
                return {
                    success: true,
                    item,
                    message: 'Unlimited Hearts activated via Duolingo Schools'
                };
            }
        } catch (passErr) {
            // fallback to general methods
        }
    }

    // Strategy 1: Check if the user already has an active pending reward matching this item
    const rawRewards = [
        ...(profile.rewards || []),
        ...((profile.rewardBundles || []).flatMap(b => b.rewards || []))
    ];

    const matchingPendingReward = rawRewards.find(r => {
        if (!r || r.consumed) return false;
        const id = String(r.id || '').toLowerCase();
        return id.includes(item.id.toLowerCase()) || (item.shopName && id.includes(item.shopName.toLowerCase()));
    });

    if (matchingPendingReward) {
        try {
            await claimGemReward(headers, userId, matchingPendingReward.id, languages);
            claimed = true;
            details = `Claimed pending reward token (${matchingPendingReward.id})`;
        } catch {
            // continue to next strategies
        }
    }

    // Strategy 2: If shop item or freeze, use purchaseShopItem
    if (!claimed && (item.type === 'SHOP_ITEM' || item.category === 'protection' || item.category === 'chests')) {
        try {
            await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
            claimed = true;
            details = `Acquired via Duolingo Store (${item.shopName})`;
        } catch (shopErr) {
            const errStr = String(shopErr.message || '').toLowerCase();
            if (errStr.includes('already_have_max') || errStr.includes('already owned') || errStr.includes('limit reached')) {
                return {
                    success: true,
                    item,
                    message: 'Already owned at maximum inventory'
                };
            }
            details = shopErr.message;
        }
    }

    // Strategy 3: Reward pattern claim (for avatar skins, World Cup suits, Tournament trophies)
    if (!claimed && item.rewardPattern) {
        const randomSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        const rewardId = item.rewardPattern.replace('{seed}', randomSeed);
        try {
            await claimGemReward(headers, userId, rewardId, languages);
            claimed = true;
            details = `Unlocked via event reward (${item.name})`;
        } catch (rewardErr) {
            const errStr = String(rewardErr.message || '').toLowerCase();
            if (errStr.includes('already') || errStr.includes('consumed')) {
                return {
                    success: true,
                    item,
                    message: 'Already unlocked on your account'
                };
            }
            if (!details) details = rewardErr.message;
        }
    }

    // Strategy 4: Achievement / Title unlock
    if (!claimed && (item.type === 'BADGE' || item.type === 'TITLE')) {
        try {
            await claimAchievement(headers, userId, item.shopName || item.id);
            claimed = true;
            details = `Equipped achievement badge (${item.name})`;
        } catch (achErr) {
            const errStr = String(achErr.message || '').toLowerCase();
            if (errStr.includes('already') || errStr.includes('completed')) {
                return {
                    success: true,
                    item,
                    message: 'Already earned and equipped'
                };
            }
        }
    }

    // Strategy 5: Direct profile outfit equipment for Avatars & Skins
    if (!claimed && item.type === 'AVATAR_SKIN') {
        try {
            const patchRes = await fetch(`https://www.duolingo.com/2017-06-30/users/${userId}`, {
                headers,
                method: 'PATCH',
                body: JSON.stringify({
                    equippedItems: [item.shopName || item.id]
                })
            });
            if (patchRes.ok) {
                claimed = true;
                details = `Equipped outfit (${item.name})`;
            }
        } catch {
            // retain details
        }
    }

    // Strategy 6: Fallback direct store grant attempt
    if (!claimed && item.shopName) {
        try {
            await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
            claimed = true;
            details = `Acquired via store grant (${item.shopName})`;
        } catch {
            // retain previous details
        }
    }

    return {
        success: claimed,
        item,
        message: claimed ? details : (details || 'Item is already owned or active in your profile.')
    };
}

/**
 * Claims a batch of items in sequence
 *
 * @param {string} rawToken
 * @param {string} rawUserId
 * @param {string[]} itemIds
 * @returns {Promise<{ results: Array, refreshedProfile: object }>}
 */
async function claimBatch(rawToken, rawUserId, itemIds) {
    const token = cleanToken(rawToken);
    let userId = cleanString(rawUserId);

    if (!token) {
        throw new Error('Duolingo auth token (JWT) is required. Please connect your account in the header.');
    }

    if (!userId) {
        userId = getUserIdFromToken(token);
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error('Please select at least one item to claim.');
    }

    let profile = null;
    try {
        profile = await getUserInventoryAndGems(token, userId);
    } catch {
        profile = { fromLanguage: 'en', learningLanguage: 'es' };
    }

    const results = [];
    for (const itemId of itemIds) {
        try {
            const res = await claimItem(token, userId, itemId, profile);
            results.push(res);
            await sleep(600);
        } catch (err) {
            results.push({
                success: false,
                itemId,
                message: err.message
            });
        }
    }

    // Re-fetch updated profile after batch
    let refreshedProfile = profile;
    try {
        await sleep(800);
        refreshedProfile = await getUserInventoryAndGems(token, userId);
    } catch {
        // Keep initial profile if refresh fails
    }

    return {
        results,
        refreshedProfile
    };
}

module.exports = {
    claimItem,
    claimBatch
};
