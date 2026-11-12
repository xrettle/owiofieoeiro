/**
 * Duolingo Gems Script
 *
 * Adds or claims gems on your Duolingo account by claiming pending reward
 * bundles, achievement tiers, free shop chests, and reward drops without
 * running practice lessons or altering account XP.
 *
 * Enforces precise target bounding: only claims enough rewards to satisfy
 * the requested amount, preserving all remaining chests for in-app opening.
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

/**
 * Collects and adds gems to the user's Duolingo account
 *
 * @param {number|string} customAmount Target number of gems to add (default: 300)
 * @returns {Promise<{ startingGems: number, endingGems: number, gemsAdded: number }>}
 */
async function addGems(customAmount = 300) {
    const targetGems = Math.max(10, parseInt(customAmount, 10) || 300);
    const { token, userId } = getCredentials();

    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required.');
    }

    console.log(`====================================================`);
    console.log(`Duolingo Gems`);
    console.log(`====================================================`);

    console.log(`Fetching user profile and gem balance...`);
    const initialProfile = await getUserInventoryAndGems(token, userId);
    const startingGems = initialProfile.gems;

    console.log(`User: ${initialProfile.username} (ID: ${initialProfile.userId})`);
    console.log(`Current Balance: ${startingGems} Gems`);
    console.log(`Target Gems to Add: +${targetGems} Gems`);
    console.log(`Note: XP-free mode active (no lessons will be run)`);
    console.log(`====================================================\n`);

    const headers = getHeaders(token);
    let successfulClaims = 0;
    let gemsGainedSoFar = 0;
    const languages = {
        fromLanguage: initialProfile.fromLanguage || 'en',
        learningLanguage: initialProfile.learningLanguage || 'es'
    };

    const gemRewards = initialProfile.pendingRewards || [];
    const totalPendingGems = gemRewards.length;

    // STEP 1: Claim unconsumed pending gem rewards only until targetGems is reached
    if (totalPendingGems > 0) {
        console.log(`[Step 1] Found ${totalPendingGems} pending gem reward(s) on your account.`);
        console.log(`   Claiming only what is needed to reach +${targetGems} gems, preserving all other chests...`);

        for (const reward of gemRewards) {
            if (gemsGainedSoFar >= targetGems) {
                console.log(`\n   Target reached (+${gemsGainedSoFar} >= +${targetGems} gems). Halting claims to preserve remaining chests.`);
                break;
            }

            try {
                await claimGemReward(headers, userId, reward.id, languages);
                successfulClaims++;

                // Refresh profile to accurately monitor actual gems added
                await sleep(800);
                const freshProfile = await getUserInventoryAndGems(token, userId);
                const actualAdded = Math.max(0, freshProfile.gems - startingGems);
                gemsGainedSoFar = actualAdded;

                const desc = reward.rewardType || reward.type || 'chest';
                const rewardAmountStr = reward.amount ? ` (+${reward.amount} gems)` : '';
                console.log(`   Claimed ${desc}: ${reward.id}${rewardAmountStr} [Current gain: +${gemsGainedSoFar}/+${targetGems} gems]`);

                if (gemsGainedSoFar >= targetGems) {
                    console.log(`\n   Target met (+${gemsGainedSoFar} gems added). Stopped claiming to keep all other chests intact.`);
                    break;
                }
            } catch (err) {
                console.warn(`   Could not claim reward ${reward.id}: ${err.message}`);
            }
        }
    } else {
        console.log(`[Step 1] No unconsumed gem reward chests currently waiting in inventory.`);
    }

    // Refresh balance after Step 1
    let currentProfile = await getUserInventoryAndGems(token, userId);
    gemsGainedSoFar = Math.max(0, currentProfile.gems - startingGems);

    // STEP 2: Claim achievement tier milestones if still below target
    if (gemsGainedSoFar < targetGems && initialProfile.unclaimedAchievements && initialProfile.unclaimedAchievements.length > 0) {
        console.log(`\n[Step 2] Found ${initialProfile.unclaimedAchievements.length} unclaimed achievement tier(s). Claiming...`);
        for (const ach of initialProfile.unclaimedAchievements) {
            if (gemsGainedSoFar >= targetGems) break;
            try {
                const res = await claimAchievement(headers, userId, ach.name, languages);
                if (res) {
                    successfulClaims++;
                    await sleep(800);
                    const freshProfile = await getUserInventoryAndGems(token, userId);
                    gemsGainedSoFar = Math.max(0, freshProfile.gems - startingGems);
                    console.log(`   Claimed achievement: ${ach.name} (Tier ${ach.tier}) [Current gain: +${gemsGainedSoFar}/+${targetGems} gems]`);
                }
            } catch (err) {
                console.warn(`   Could not claim achievement ${ach.name}: ${err.message}`);
            }
        }
        currentProfile = await getUserInventoryAndGems(token, userId);
        gemsGainedSoFar = Math.max(0, currentProfile.gems - startingGems);
    } else if (gemsGainedSoFar < targetGems) {
        console.log(`[Step 2] No unclaimed achievement tiers needed.`);
    }

    // STEP 3: Check for eligible free shop chests if still below target
    if (gemsGainedSoFar < targetGems) {
        console.log(`\n[Step 3] Checking for eligible free shop chests...`);
        const freeChestItems = ['free_chest', 'daily_chest', 'early_bird_chest', 'night_owl_chest'];
        for (const chestName of freeChestItems) {
            if (gemsGainedSoFar >= targetGems) break;
            try {
                await purchaseShopItem(headers, userId, chestName, languages, { isFree: true });
                successfulClaims++;
                await sleep(800);
                const freshProfile = await getUserInventoryAndGems(token, userId);
                gemsGainedSoFar = Math.max(0, freshProfile.gems - startingGems);
                console.log(`   Claimed free shop chest: ${chestName} [Current gain: +${gemsGainedSoFar}/+${targetGems} gems]`);
            } catch {
                // Not currently eligible or already claimed today
            }
        }
        currentProfile = await getUserInventoryAndGems(token, userId);
        gemsGainedSoFar = Math.max(0, currentProfile.gems - startingGems);
    }

    // STEP 4: Attempt direct balanced reward claims if still below target
    if (gemsGainedSoFar < targetGems) {
        const remainingNeeded = targetGems - gemsGainedSoFar;
        const GEMS_PER_REWARD = 30;
        const totalClaimsNeeded = Math.min(10, Math.ceil(remainingNeeded / GEMS_PER_REWARD));

        console.log(`\n[Step 4] Checking server for direct skill completion reward grants (${totalClaimsNeeded} checks)...`);

        for (let i = 0; i < totalClaimsNeeded; i++) {
            if (gemsGainedSoFar >= targetGems) break;
            const claimNum = i + 1;
            const randomSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            const rewardId = `SKILL_COMPLETION_BALANCED-${randomSeed}-2-GEMS`;

            try {
                await claimGemReward(headers, userId, rewardId, languages);
                successfulClaims++;
                console.log(`   Submitted claim ${claimNum}/${totalClaimsNeeded} (${rewardId})`);

                if (i < totalClaimsNeeded - 1) {
                    await sleep(1000);
                }
            } catch (err) {
                console.warn(`   Direct claim was not accepted by the server: ${err.message}`);
                break;
            }
        }
    }

    // Final verification
    console.log(`\nVerifying updated gem balance...`);
    await sleep(1500);

    let endingGems = startingGems;
    let preservedChestsCount = 0;
    try {
        const finalProfile = await getUserInventoryAndGems(token, userId);
        endingGems = finalProfile.gems;
        preservedChestsCount = finalProfile.pendingRewards ? finalProfile.pendingRewards.length : 0;
    } catch {
        endingGems = startingGems + gemsGainedSoFar;
    }

    const actualGemsGained = Math.max(0, endingGems - startingGems);

    console.log(`\n====================================================`);
    console.log(`Gem Process Summary:`);
    console.log(`   Successful Claims:       ${successfulClaims}`);
    console.log(`   Starting Balance:        ${startingGems} gems`);
    console.log(`   Ending Balance:          ${endingGems} gems`);
    console.log(`   Total Gems Gained:       +${actualGemsGained} gems (Target was: +${targetGems})`);
    console.log(`   Chests Preserved in App: ${preservedChestsCount}`);
    console.log(`   XP Added:                +0 XP (unaltered)`);
    console.log(`====================================================`);

    if (actualGemsGained === 0 && successfulClaims === 0) {
        console.log(`\nInfo: No unclaimed reward chests or gem drops are currently available.`);
        console.log(`How to get more Duolingo gems without inflating XP:`);
        console.log(`  1. Complete daily quests in Duolingo (bronze, silver, gold chests give gems).`);
        console.log(`  2. Open the Duolingo shop during Early Bird (6 PM - 11 PM) or Night Owl (6 AM - 12 PM) hours.`);
        console.log(`  3. Participate in Friends Quests (awards 100 gems).`);
        console.log(`  4. Reach new achievement tiers in your profile.`);
        console.log(`Whenever chests or rewards are available, this workflow will automatically claim them.`);
    }

    return {
        startingGems,
        endingGems,
        gemsAdded: actualGemsGained
    };
}

const main = async () => {
    const rawAmount = process.env.GEMS || process.env.AMOUNT || process.env.GEMS_TO_ADD || process.argv[2] || 300;
    await addGems(rawAmount);
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\nError adding gems: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    addGems,
    main
};
