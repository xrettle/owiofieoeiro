/**
 * Item Claimer Service
 *
 * Handles claiming, equipping, and unlocking Duolingo extra items
 * (avatars, country suits, tournament banners, streak freezes, chests).
 *
 * Strictly integrates with official Duolingo endpoints:
 * - Avatar costumes & suits: PATCH /users/${userId}/built-avatar-states
 * - Shop items & freezes: POST /2023-05-23/users/${userId}/shop-items
 * - Achievements & badges: PATCH /2017-06-30/users/${userId}/achievements/${id}
 * - Rewards & drops: PATCH /2017-06-30/users/${userId}/rewards/${id}
 *
 * No fake success fallbacks. All results report real Duolingo responses.
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
 * Equips an avatar costume or suit via Duolingo's official built-avatar-states API
 *
 * @param {string} token Duolingo JWT token
 * @param {string} userId Duolingo user ID
 * @param {object} item Catalog item with costumeArtboardId
 * @param {Function} [customFetch] Optional custom fetch implementation
 * @returns {Promise<{ success: boolean, message: string, state?: object }>}
 */
async function equipBuiltAvatarState(token, userId, item, customFetch = null) {
    const fetchFn = customFetch || fetch;
    const headers = getHeaders(token);
    const getUrl = `https://www.duolingo.com/users/${userId}/built-avatar-states`;

    let getRes = null;
    try {
        getRes = await fetchFn(getUrl, {
            headers,
            method: 'GET'
        });
    } catch (netErr) {
        return {
            success: false,
            message: `Network error connecting to Duolingo avatar service: ${netErr.message}`
        };
    }

    if (getRes.status === 401) {
        return {
            success: false,
            message: 'Duolingo authentication failed (HTTP 401): Invalid or expired JWT token. Please reconnect your account.'
        };
    }

    if (getRes.status === 403) {
        return {
            success: false,
            message: 'Duolingo access denied (HTTP 403): Your account lacks permission to edit this avatar.'
        };
    }

    if (!getRes.ok) {
        const errText = await getRes.text().catch(() => '');
        return {
            success: false,
            message: `Duolingo avatar query failed (HTTP ${getRes.status}): ${errText || 'Unknown error'}`
        };
    }

    let currentState = null;
    try {
        const data = await getRes.json();
        currentState = data.builtAvatarStates?.[0];
    } catch (parseErr) {
        return {
            success: false,
            message: `Failed to parse Duolingo avatar state: ${parseErr.message}`
        };
    }

    if (!currentState) {
        return {
            success: false,
            message: 'No active avatar found on your Duolingo account. Please set up your avatar in the Duolingo app first.'
        };
    }

    const costumeId = item.costumeArtboardId || 1;
    const currentCostume = currentState.state?.CostumeArtboard;
    const currentHasCostume = currentState.state?.HasCostume;

    if (currentHasCostume === 1 && currentCostume === costumeId) {
        return {
            success: true,
            message: `Already equipped on your Duolingo avatar (${item.name})`,
            state: currentState
        };
    }

    // Build updated state with costume
    const updatedState = {
        ...currentState,
        isSavedState: true,
        state: {
            ...currentState.state,
            HasCostume: 1,
            CostumeArtboard: costumeId
        }
    };

    const patchUrl = `https://www.duolingo.com/users/${userId}/built-avatar-states`;
    const patchPayload = {
        builtAvatarStates: [updatedState],
        shouldRenderAvatar: true
    };

    let patchRes = null;
    try {
        patchRes = await fetchFn(patchUrl, {
            headers,
            method: 'PATCH',
            body: JSON.stringify(patchPayload)
        });
    } catch (patchErr) {
        return {
            success: false,
            message: `Failed to send avatar update to Duolingo: ${patchErr.message}`
        };
    }

    if (patchRes.ok || patchRes.status === 200 || patchRes.status === 204) {
        return {
            success: true,
            message: `Equipped ${item.name} to your Duolingo avatar`,
            state: updatedState
        };
    }

    const patchErrText = await patchRes.text().catch(() => '');
    return {
        success: false,
        message: `Duolingo rejected avatar update (HTTP ${patchRes.status}): ${patchErrText || 'Server error'}`
    };
}

/**
 * Claims a specific item from the catalog for a user
 *
 * @param {string} rawToken Duolingo JWT token
 * @param {string} rawUserId Duolingo user ID
 * @param {string} itemId ID of the item in ITEMS_CATALOG
 * @param {object} [userProfile] Pre-fetched profile to avoid redundant API calls
 * @param {object} [options] Optional configuration (e.g. customFetch)
 * @returns {Promise<{ success: boolean, item: object, message: string }>}
 */
async function claimItem(rawToken, rawUserId, itemId, userProfile = null, options = {}) {
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

    const fetchFn = options.fetch || fetch;
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

    // Special Case: Unlimited Hearts Classroom Pass
    if (item.id === 'unlimited_hearts_pass' || item.type === 'CLASSROOM_PASS') {
        try {
            const classRes = await fetchFn('https://schools.duolingo.com/api/2/classrooms', {
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
            const errText = await classRes.text().catch(() => '');
            return {
                success: false,
                item,
                message: `Classroom pass activation failed (HTTP ${classRes.status}): ${errText || 'Unknown error'}`
            };
        } catch (passErr) {
            return {
                success: false,
                item,
                message: `Classroom pass error: ${passErr.message}`
            };
        }
    }

    // Step 0: Check if the user already has this item equipped or in inventory
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

    const currentCostumeId = profile.builtAvatarStates?.[0]?.state?.CostumeArtboard;
    const currentHasCostume = profile.builtAvatarStates?.[0]?.state?.HasCostume;
    const isCostumeEquipped = Boolean(
        item.costumeArtboardId &&
        currentHasCostume === 1 &&
        currentCostumeId === item.costumeArtboardId
    );

    if (isAlreadyEquipped || isAlreadyInInventory || isCostumeEquipped) {
        return {
            success: true,
            item,
            message: 'Already owned and equipped on your profile'
        };
    }

    // Step 1: Suits and Avatars (Country suits, costume artboards, avatar outfits)
    if (item.type === 'COUNTRY_SUIT' || item.type === 'AVATAR_SKIN' || item.category === 'suits' || item.category === 'avatars') {
        const avatarRes = await equipBuiltAvatarState(token, userId, item, fetchFn);
        if (avatarRes.success) {
            // Background sync to legacy endpoints (non-blocking)
            try {
                const legacyPayload = JSON.stringify({
                    currentOutfit: item.shopName || item.id,
                    equippedItems: [item.shopName || item.id]
                });
                fetchFn(`https://www.duolingo.com/2017-06-30/users/${userId}`, {
                    headers,
                    method: 'PATCH',
                    body: legacyPayload
                }).catch(() => {});
            } catch {
                // ignore background sync errors
            }

            return {
                success: true,
                item,
                message: avatarRes.message
            };
        }

        // If equip failed due to auth error, fail immediately with clear reason
        if (avatarRes.message.includes('401') || avatarRes.message.includes('403') || avatarRes.message.includes('authentication')) {
            return {
                success: false,
                item,
                message: avatarRes.message
            };
        }

        // Attempt fallback to store purchase if item exists in store
        if (item.shopName) {
            try {
                await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
                return {
                    success: true,
                    item,
                    message: `Acquired ${item.name} via Duolingo store`
                };
            } catch (shopErr) {
                const errStr = String(shopErr.message || '').toLowerCase();
                if (errStr.includes('already') || errStr.includes('owned') || errStr.includes('max')) {
                    return {
                        success: true,
                        item,
                        message: 'Already unlocked on your account'
                    };
                }
            }
        }

        // Duolingo rejected avatar update and store acquisition failed
        return {
            success: false,
            item,
            message: avatarRes.message || 'Duolingo was unable to equip this item. The event or outfit may be archived on Duolingo servers.'
        };
    }

    // Step 2: Protection, Streak Freezes, and Chests (Shop items)
    if (item.type === 'SHOP_ITEM' || item.category === 'protection' || item.category === 'chests') {
        // First check pending rewards for chest items
        const rawRewards = [
            ...(profile.rewards || []),
            ...((profile.rewardBundles || []).flatMap(b => b.rewards || []))
        ];
        const matchingReward = rawRewards.find(r => {
            if (!r || r.consumed) return false;
            const id = String(r.id || '').toLowerCase();
            return candidateIdentifiers.some(cid => id.includes(cid));
        });

        if (matchingReward) {
            try {
                await claimGemReward(headers, userId, matchingReward.id, languages);
                return {
                    success: true,
                    item,
                    message: `Claimed pending reward token (${matchingReward.id})`
                };
            } catch {
                // continue to purchaseShopItem
            }
        }

        try {
            await purchaseShopItem(headers, userId, item.shopName, languages, { isFree: true });
            return {
                success: true,
                item,
                message: `Acquired ${item.name} from Duolingo store`
            };
        } catch (shopErr) {
            const errStr = String(shopErr.message || '').toLowerCase();
            if (errStr.includes('already_have_max') || errStr.includes('already owned') || errStr.includes('limit reached')) {
                return {
                    success: true,
                    item,
                    message: 'Already owned at maximum inventory'
                };
            }
            return {
                success: false,
                item,
                message: shopErr.message || `Failed to acquire ${item.name} from store`
            };
        }
    }

    // Step 3: Badges, Titles, and Achievements
    if (item.type === 'BADGE' || item.type === 'TITLE' || item.category === 'banners') {
        try {
            const achRes = await claimAchievement(headers, userId, item.shopName || item.id, languages);
            if (achRes) {
                return {
                    success: true,
                    item,
                    message: `Equipped achievement badge (${item.name})`
                };
            }
        } catch (achErr) {
            const errStr = String(achErr.message || '').toLowerCase();
            if (errStr.includes('already') || errStr.includes('completed')) {
                return {
                    success: true,
                    item,
                    message: 'Already earned and equipped'
                };
            }
            return {
                success: false,
                item,
                message: achErr.message || `Failed to claim badge ${item.name}`
            };
        }

        // Try reward pattern claim
        if (item.rewardPattern) {
            const randomSeed = Math.random().toString(36).substring(2, 10);
            const rewardId = item.rewardPattern.replace('{seed}', randomSeed);
            try {
                await claimGemReward(headers, userId, rewardId, languages);
                return {
                    success: true,
                    item,
                    message: `Unlocked via tournament reward (${item.name})`
                };
            } catch (rewErr) {
                const errStr = String(rewErr.message || '').toLowerCase();
                if (errStr.includes('already') || errStr.includes('consumed')) {
                    return {
                        success: true,
                        item,
                        message: 'Already earned and equipped'
                    };
                }
            }
        }

        return {
            success: false,
            item,
            message: `Duolingo could not unlock badge ${item.name}. Quest or tournament requirement not yet met.`
        };
    }

    // Fallback: Real API claim attempt without mock overrides
    return {
        success: false,
        item,
        message: 'Item could not be claimed on Duolingo servers.'
    };
}

/**
 * Claims a batch of items in sequence
 *
 * @param {string} rawToken Duolingo JWT token
 * @param {string} rawUserId Duolingo user ID
 * @param {string[]} itemIds Array of item IDs
 * @param {object} [options] Optional configuration
 * @returns {Promise<{ results: Array, refreshedProfile: object }>}
 */
async function claimBatch(rawToken, rawUserId, itemIds, options = {}) {
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
            const res = await claimItem(token, userId, itemId, profile, options);
            results.push(res);
            await sleep(500);
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
        await sleep(600);
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
    claimBatch,
    equipBuiltAvatarState
};
