/**
 * Item Claimer Service
 *
 * Handles claiming, equipping, and unlocking Duolingo extra items
 * (avatars, country suits, tournament banners, streak freezes, chests).
 */

const {
    getCredentials,
    getHeaders,
    getUserInventoryAndGems,
    claimGemReward,
    claimAchievement,
    purchaseShopItem,
    sleep
} = require('./helper.js');
const { ITEMS_CATALOG } = require('./items-catalog.js');

/**
 * Claims a specific item from the catalog for a user
 *
 * @param {string} token Duolingo JWT token
 * @param {string} userId Duolingo user ID
 * @param {string} itemId ID of the item in ITEMS_CATALOG
 * @param {object} [userProfile] Pre-fetched profile to avoid redundant API calls
 * @returns {Promise<{ success: boolean, item: object, message: string }>}
 */
async function claimItem(token, userId, itemId, userProfile = null) {
    const item = ITEMS_CATALOG.find(i => i.id === itemId);
    if (!item) {
        throw new Error(`Item ${itemId} not found in catalog.`);
    }

    const headers = getHeaders(token);
    const profile = userProfile || await getUserInventoryAndGems(token, userId);
    const languages = {
        fromLanguage: profile.fromLanguage || 'en',
        learningLanguage: profile.learningLanguage || 'es'
    };

    let claimed = false;
    let details = '';

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
            details = `Claimed pending reward token ${matchingPendingReward.id}`;
        } catch (err) {
            // fallback to next strategies
        }
    }

    // Strategy 2: If shop item or freeze, use purchaseShopItem
    if (!claimed && (item.type === 'SHOP_ITEM' || item.category === 'protection' || item.category === 'chests')) {
        try {
            await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
            claimed = true;
            details = `Acquired via Duolingo Shop (${item.shopName})`;
        } catch (shopErr) {
            // Some items might already be owned or have specific cooldowns
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
            details = `Unlocked via reward grant (${rewardId})`;
        } catch (rewardErr) {
            if (!details) details = rewardErr.message;
        }
    }

    // Strategy 4: Fallback direct shop purchase attempt
    if (!claimed && item.shopName) {
        try {
            await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
            claimed = true;
            details = `Acquired via direct store grant (${item.shopName})`;
        } catch {
            // retain previous details
        }
    }

    return {
        success: claimed,
        item,
        message: claimed ? details : (details || 'Item is already owned or not currently unlocked by Duolingo server.')
    };
}

/**
 * Claims a batch of items in sequence
 *
 * @param {string} token
 * @param {string} userId
 * @param {string[]} itemIds
 * @returns {Promise<{ results: Array, refreshedProfile: object }>}
 */
async function claimBatch(token, userId, itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error('Please select at least one item to claim.');
    }

    const profile = await getUserInventoryAndGems(token, userId);
    const results = [];

    for (const itemId of itemIds) {
        try {
            const res = await claimItem(token, userId, itemId, profile);
            results.push(res);
            await sleep(800);
        } catch (err) {
            results.push({
                success: false,
                itemId,
                message: err.message
            });
        }
    }

    // Re-fetch updated profile after batch
    await sleep(1000);
    const refreshedProfile = await getUserInventoryAndGems(token, userId);

    return {
        results,
        refreshedProfile
    };
}

module.exports = {
    claimItem,
    claimBatch
};
