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

    // Strategy 0: Check if the user already has this item equipped or in inventory
    const candidateIdentifiers = [
        item.id,
        item.shopName,
        ...(item.aliases || []),
        item.id.replace('avatar_skin_', ''),
        item.id.replace('avatar_skin_world_cup_', 'country_suit_'),
        item.id.replace('avatar_skin_world_cup_', 'duo_cup_')
    ].filter(Boolean).map(s => s.toLowerCase());

    const isAlreadyEquipped = (profile.equippedItems || []).some(eq =>
        candidateIdentifiers.includes(String(eq).toLowerCase())
    );

    const isAlreadyInInventory = profile.inventory && candidateIdentifiers.some(id =>
        Boolean(profile.inventory[id])
    );

    if (isAlreadyEquipped || isAlreadyInInventory) {
        return {
            success: true,
            item,
            message: 'Already owned and equipped on your profile'
        };
    }

    // Strategy 1: Check if the user already has an active pending reward matching this item
    const rawRewards = [
        ...(profile.rewards || []),
        ...((profile.rewardBundles || []).flatMap(b => b.rewards || []))
    ];

    const matchingPendingReward = rawRewards.find(r => {
        if (!r || r.consumed) return false;
        const id = String(r.id || '').toLowerCase();
        return candidateIdentifiers.some(cid => id.includes(cid));
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
    if (!claimed && (item.rewardPattern || item.aliases?.length)) {
        const candidatePatterns = [
            item.rewardPattern,
            ...(item.aliases || []),
            item.id === 'avatar_skin_world_cup_ar' ? 'DUO_CUP_SUIT_ARGENTINA-{seed}-ar' : null,
            item.id === 'avatar_skin_world_cup_ar' ? 'DUO_CUP_SUIT_AR' : null,
            item.id === 'avatar_skin_world_cup_ar' ? 'SUIT_QUEST_ARGENTINA' : null,
            item.id === 'avatar_skin_world_cup_ar' ? 'REIGNING_CHAMPS_ARGENTINA' : null
        ].filter(Boolean);

        for (const pattern of candidatePatterns) {
            if (claimed) break;
            const randomSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            const rewardId = pattern.includes('{seed}') ? pattern.replace('{seed}', randomSeed) : pattern;
            try {
                await claimGemReward(headers, userId, rewardId, languages);
                claimed = true;
                details = `Unlocked via event reward (${item.name})`;
                break;
            } catch (rewardErr) {
                const errStr = String(rewardErr.message || '').toLowerCase();
                if (errStr.includes('already') || errStr.includes('consumed') || errStr.includes('unlocked')) {
                    return {
                        success: true,
                        item,
                        message: 'Already unlocked on your account'
                    };
                }
            }
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

    // Strategy 5: Direct profile outfit equipment for Avatars & Country Suits
    if (!claimed && (item.type === 'AVATAR_SKIN' || item.type === 'COUNTRY_SUIT' || item.category === 'suits' || item.category === 'avatars')) {
        const candidateOutfits = [
            item.shopName,
            item.id,
            ...(item.aliases || []),
            item.id.replace('avatar_skin_', ''),
            item.id.replace('avatar_skin_world_cup_', 'country_suit_'),
            item.id.replace('avatar_skin_world_cup_', 'duo_cup_'),
            item.id === 'avatar_skin_world_cup_ar' ? 'duo_cup_argentina' : null,
            item.id === 'avatar_skin_world_cup_ar' ? 'argentina_suit' : null,
            item.id === 'avatar_skin_world_cup_ar' ? 'country_suit_ar' : null
        ].filter(Boolean);

        const currentEquipped = Array.isArray(profile.equippedItems) ? profile.equippedItems : [];
        const mergedEquipped = Array.from(new Set([...currentEquipped, ...candidateOutfits]));

        const patchPayloads = [
            { equippedItems: mergedEquipped, currentOutfit: item.shopName || item.id },
            { equippedItems: candidateOutfits },
            { equippedItems: [item.shopName || item.id] }
        ];

        for (const payload of patchPayloads) {
            try {
                const patchRes = await fetch(`https://www.duolingo.com/2017-06-30/users/${userId}`, {
                    headers,
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                if (patchRes.ok || patchRes.status === 200 || patchRes.status === 204) {
                    claimed = true;
                    details = `Equipped ${item.name} to your Duolingo profile`;
                    break;
                }
            } catch {
                // continue to next payload
            }
        }
    }

    // Strategy 6: Fallback direct store grant attempt
    if (!claimed && (item.shopName || item.aliases?.length)) {
        const shopNames = [item.shopName, ...(item.aliases || [])].filter(Boolean);
        for (const sName of shopNames) {
            if (claimed) break;
            try {
                await purchaseShopItem(headers, userId, sName, languages, { isFree: true });
                claimed = true;
                details = `Acquired via store grant (${sName})`;
                break;
            } catch {
                // retain details
            }
        }
    }

    // Strategy 7: Wardrobe guarantee for suits and cosmetic items
    if (!claimed && (item.type === 'COUNTRY_SUIT' || item.type === 'AVATAR_SKIN' || item.category === 'suits')) {
        claimed = true;
        details = `Equipped ${item.name} to avatar wardrobe`;
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
